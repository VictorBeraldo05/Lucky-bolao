import { PoolStatus, Prisma } from "@prisma/client";
import { addDays, parse } from "date-fns";
import { fetchLatestOfficialLotofacilResult, fetchOfficialLotofacilResultByContest, type OfficialLotofacilResult } from "@/lib/lotofacil-official";
import { publishContestResult } from "@/lib/contest-settlement";
import { prisma } from "@/lib/prisma";

function parseContestDate(value: string | null) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T22:00:00-03:00`);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return parse(`${value} 22:00`, "dd/MM/yyyy HH:mm", new Date());
  }

  return null;
}

function replaceContestNumberInText(value: string | null | undefined, nextContestNumber: number) {
  if (!value) return value ?? null;
  return value.replace(/\b3\d{3}\b/g, String(nextContestNumber));
}

async function ensureNextLotofacilContestAndPools(latestOfficial: OfficialLotofacilResult) {
  const lottery = await prisma.lottery.findUnique({
    where: { slug: "lotofacil" },
  });

  if (!lottery) {
    throw new Error("Loteria Lotofácil não encontrada.");
  }

  const nextContestNumber = latestOfficial.contestNumber + 1;
  const nextDrawDate = parseContestDate(latestOfficial.nextDrawDate) ?? addDays(new Date(), 1);

  const nextContest = await prisma.contest.upsert({
    where: {
      lotteryId_contestNumber: {
        lotteryId: lottery.id,
        contestNumber: nextContestNumber,
      },
    },
    update: {
      drawDate: nextDrawDate,
      status: "scheduled",
    },
    create: {
      lotteryId: lottery.id,
      contestNumber: nextContestNumber,
      drawDate: nextDrawDate,
      status: "scheduled",
    },
  });

  const alreadyProvisionedPools = await prisma.pool.count({
    where: {
      contestId: nextContest.id,
    },
  });

  if (alreadyProvisionedPools > 0) {
    return { nextContestNumber, createdPools: 0 };
  }

  const templateContest = await prisma.contest.findUnique({
    where: {
      lotteryId_contestNumber: {
        lotteryId: lottery.id,
        contestNumber: latestOfficial.contestNumber,
      },
    },
    include: {
      pools: {
        include: {
          games: true,
        },
      },
    },
  });

  if (!templateContest || templateContest.pools.length === 0) {
    return { nextContestNumber, createdPools: 0 };
  }

  for (const templatePool of templateContest.pools) {
    await prisma.pool.create({
      data: {
        code: replaceContestNumberInText(templatePool.code, nextContestNumber) ?? templatePool.code,
        lotteryId: templatePool.lotteryId,
        gameTypeId: templatePool.gameTypeId,
        contestId: nextContest.id,
        title: replaceContestNumberInText(templatePool.title, nextContestNumber) ?? templatePool.title,
        description: replaceContestNumberInText(templatePool.description, nextContestNumber),
        status: PoolStatus.OPEN,
        totalValue: new Prisma.Decimal(templatePool.totalValue),
        sharePrice: new Prisma.Decimal(templatePool.sharePrice),
        totalShares: templatePool.totalShares,
        availableShares: templatePool.totalShares,
        relativeChance: replaceContestNumberInText(templatePool.relativeChance, nextContestNumber),
        ticketImageUrl: templatePool.ticketImageUrl,
        ticketCode: null,
        metadata: templatePool.metadata ?? undefined,
        games: {
          create: templatePool.games.map((game) => ({
            title: game.title,
            numbers: game.numbers,
          })),
        },
      },
    });
  }

  return { nextContestNumber, createdPools: templateContest.pools.length };
}

export async function syncPendingLotofacilContests() {
  const latestOfficial = await fetchLatestOfficialLotofacilResult();

  const contests = await prisma.contest.findMany({
    where: {
      lottery: { slug: "lotofacil" },
      contestNumber: { lte: latestOfficial.contestNumber },
      OR: [
        { status: { not: "finished" } },
        { result: null },
      ],
    },
    include: {
      result: true,
    },
    orderBy: { contestNumber: "asc" },
  });

  const processed: Array<{ contestNumber: number; alreadyProcessed: boolean }> = [];

  for (const contest of contests) {
    const official = contest.contestNumber === latestOfficial.contestNumber
      ? latestOfficial
      : await fetchOfficialLotofacilResultByContest(contest.contestNumber);

    const result = await publishContestResult({
      contestId: contest.id,
      drawnNumbers: official.drawnNumbers,
      prizeBreakdown: official.prizeBreakdown,
      source: official.source,
    });

    processed.push({
      contestNumber: contest.contestNumber,
      alreadyProcessed: result.alreadyProcessed,
    });
  }

  const provision = await ensureNextLotofacilContestAndPools(latestOfficial);

  return {
    latestOfficialContestNumber: latestOfficial.contestNumber,
    nextContestNumber: provision.nextContestNumber,
    createdPools: provision.createdPools,
    processed,
  };
}
