import { fetchLatestOfficialLotofacilResult, fetchOfficialLotofacilResultByContest } from "@/lib/lotofacil-official";
import { publishContestResult } from "@/lib/contest-settlement";
import { prisma } from "@/lib/prisma";

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

  return {
    latestOfficialContestNumber: latestOfficial.contestNumber,
    processed,
  };
}
