import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminPoolsAnalysisTable } from "@/components/admin-pools-analysis-table";

export default async function AdminPoolsPage() {
  await requireAdmin();

  const pools = await prisma.pool.findMany({
    include: {
      contest: {
        include: {
          result: true,
        },
      },
      lottery: true,
      gameType: true,
      games: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const poolRows = pools.map((pool) => ({
    id: pool.id,
    code: pool.code,
    title: pool.title,
    status: pool.status,
    sharePrice: pool.sharePrice.toString(),
    totalShares: pool.totalShares,
    availableShares: pool.availableShares,
    lotteryName: pool.lottery.name,
    gameTypeName: pool.gameType.name,
    contestNumber: pool.contest.contestNumber,
    drawDate: pool.contest.drawDate.toISOString(),
    resultNumbers: pool.contest.result?.drawnNumbers ?? [],
    games: pool.games.map((game) => ({
      id: game.id,
      title: game.title,
      numbers: game.numbers,
      hits: game.hits ?? null,
      prizeAmount: game.prizeAmount?.toString() ?? null,
    })),
  }));

  return (
    <AdminShell
      currentPath="/admin/boloes"
      title="Bolões"
      description="Analise concursos, jogos, resultado do sorteio e bilhetes premiados de qualquer bolão da operação."
    >
      <AdminPoolsAnalysisTable pools={poolRows} />
    </AdminShell>
  );
}
