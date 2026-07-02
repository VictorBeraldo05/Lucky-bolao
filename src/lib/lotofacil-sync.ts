import { PoolStatus, Prisma } from "@prisma/client";
import { addDays, parse } from "date-fns";
import {
  fetchLatestOfficialLotofacilResult,
  fetchOfficialLotofacilResultByContest,
  type OfficialLotofacilResult,
} from "@/lib/lotofacil-official";
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

type TemplatePool = {
  code: string;
  lotteryId: string;
  gameTypeId: string;
  title: string;
  description: string | null;
  totalValue: Prisma.Decimal;
  sharePrice: Prisma.Decimal;
  totalShares: number;
  relativeChance: string | null;
  ticketImageUrl: string | null;
  metadata: Prisma.JsonValue | null;
  games: Array<{
    title: string;
    numbers: number[];
  }>;
};

async function getTemplatePoolsForLotofacil(lotteryId: string) {
  const templateContest = await prisma.contest.findFirst({
    where: {
      lotteryId,
      pools: {
        some: {},
      },
    },
    include: {
      pools: {
        include: {
          games: true,
        },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { contestNumber: "desc" },
  });

  if (!templateContest || templateContest.pools.length === 0) {
    throw new Error("Nenhum bolão-modelo da Lotofácil foi encontrado para provisionar novos concursos.");
  }

  return templateContest.pools.map<TemplatePool>((pool) => ({
    code: pool.code,
    lotteryId: pool.lotteryId,
    gameTypeId: pool.gameTypeId,
    title: pool.title,
    description: pool.description,
    totalValue: new Prisma.Decimal(pool.totalValue),
    sharePrice: new Prisma.Decimal(pool.sharePrice),
    totalShares: pool.totalShares,
    relativeChance: pool.relativeChance,
    ticketImageUrl: pool.ticketImageUrl,
    metadata: pool.metadata,
    games: pool.games.map((game) => ({
      title: game.title,
      numbers: game.numbers,
    })),
  }));
}

async function resolveContestDate(
  contestNumber: number,
  latestOfficial: OfficialLotofacilResult,
  previousDrawDate: Date | null,
) {
  if (contestNumber === latestOfficial.contestNumber) {
    return parseContestDate(latestOfficial.drawDate) ?? previousDrawDate ?? addDays(new Date(), -1);
  }

  if (contestNumber === latestOfficial.contestNumber + 1) {
    return parseContestDate(latestOfficial.nextDrawDate) ?? previousDrawDate ?? addDays(new Date(), 1);
  }

  if (contestNumber < latestOfficial.contestNumber) {
    const officialContest = await fetchOfficialLotofacilResultByContest(contestNumber);
    return parseContestDate(officialContest.drawDate) ?? previousDrawDate ?? addDays(new Date(), -1);
  }

  return previousDrawDate ? addDays(previousDrawDate, 1) : addDays(new Date(), 1);
}

async function ensureContestExistsWithPools(
  contestNumber: number,
  drawDate: Date,
  lotteryId: string,
  templatePools: TemplatePool[],
) {
  const contest = await prisma.contest.upsert({
    where: {
      lotteryId_contestNumber: {
        lotteryId,
        contestNumber,
      },
    },
    update: {
      drawDate,
      status: "scheduled",
    },
    create: {
      lotteryId,
      contestNumber,
      drawDate,
      status: "scheduled",
    },
  });

  const alreadyProvisionedPools = await prisma.pool.count({
    where: {
      contestId: contest.id,
    },
  });

  if (alreadyProvisionedPools === 0) {
    for (const templatePool of templatePools) {
      await prisma.pool.create({
        data: {
          code: replaceContestNumberInText(templatePool.code, contestNumber) ?? templatePool.code,
          lotteryId: templatePool.lotteryId,
          gameTypeId: templatePool.gameTypeId,
          contestId: contest.id,
          title: replaceContestNumberInText(templatePool.title, contestNumber) ?? templatePool.title,
          description: replaceContestNumberInText(templatePool.description, contestNumber),
          status: PoolStatus.OPEN,
          totalValue: new Prisma.Decimal(templatePool.totalValue),
          sharePrice: new Prisma.Decimal(templatePool.sharePrice),
          totalShares: templatePool.totalShares,
          availableShares: templatePool.totalShares,
          relativeChance: replaceContestNumberInText(templatePool.relativeChance, contestNumber),
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
  }

  return {
    contest,
    createdPools: alreadyProvisionedPools === 0 ? templatePools.length : 0,
  };
}

async function ensureLotofacilContestChainAndPools(latestOfficial: OfficialLotofacilResult) {
  const lottery = await prisma.lottery.findUnique({
    where: { slug: "lotofacil" },
  });

  if (!lottery) {
    throw new Error("Loteria Lotofácil não encontrada.");
  }

  const templatePools = await getTemplatePoolsForLotofacil(lottery.id);
  const existingContests = await prisma.contest.findMany({
    where: { lotteryId: lottery.id },
    select: {
      contestNumber: true,
      drawDate: true,
    },
    orderBy: { contestNumber: "asc" },
  });

  const highestExistingContest = existingContests.at(-1);
  const startContestNumber = highestExistingContest ? highestExistingContest.contestNumber + 1 : latestOfficial.contestNumber;
  const finalContestNumber = latestOfficial.contestNumber + 1;

  if (startContestNumber > finalContestNumber) {
    return {
      nextContestNumber: finalContestNumber,
      createdPools: 0,
      ensuredContests: [] as number[],
    };
  }

  let previousDrawDate = highestExistingContest?.drawDate ?? null;
  let createdPools = 0;
  const ensuredContests: number[] = [];

  for (let contestNumber = startContestNumber; contestNumber <= finalContestNumber; contestNumber += 1) {
    const drawDate = await resolveContestDate(contestNumber, latestOfficial, previousDrawDate);
    const ensured = await ensureContestExistsWithPools(contestNumber, drawDate, lottery.id, templatePools);

    previousDrawDate = ensured.contest.drawDate;
    createdPools += ensured.createdPools;
    ensuredContests.push(contestNumber);
  }

  return {
    nextContestNumber: finalContestNumber,
    createdPools,
    ensuredContests,
  };
}

export async function syncPendingLotofacilContests() {
  const latestOfficial = await fetchLatestOfficialLotofacilResult();
  const provision = await ensureLotofacilContestChainAndPools(latestOfficial);

  const contests = await prisma.contest.findMany({
    where: {
      lottery: { slug: "lotofacil" },
      contestNumber: { lte: latestOfficial.contestNumber },
      OR: [{ status: { not: "finished" } }, { result: null }],
    },
    include: {
      result: true,
    },
    orderBy: { contestNumber: "asc" },
  });

  const processed: Array<{ contestNumber: number; alreadyProcessed: boolean }> = [];

  for (const contest of contests) {
    const official =
      contest.contestNumber === latestOfficial.contestNumber
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

  return {
    latestOfficialContestNumber: latestOfficial.contestNumber,
    nextContestNumber: provision.nextContestNumber,
    createdPools: provision.createdPools,
    ensuredContests: provision.ensuredContests,
    processed,
  };
}
