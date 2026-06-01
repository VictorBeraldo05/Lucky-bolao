import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { MyGamesTable } from "@/components/my-games-table";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";

export default async function MyGamesPage() {
  const user = await requireUser();
  await syncPendingCartPaymentsForUser(user.id);

  const shares = await prisma.poolShare.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        include: {
          lottery: true,
          gameType: true,
          games: true,
          contest: {
            include: {
              result: true,
            },
          },
        },
      },
      prizes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const shareRows = shares.map((share) => ({
    id: share.id,
    quantity: share.quantity,
    totalPrice: share.totalPrice.toString(),
    totalPrize: share.prizes.reduce((sum, item) => sum + Number(item.amount), 0),
    pool: {
      code: share.pool.code,
      title: share.pool.title,
      status: share.pool.status,
      lotteryName: share.pool.lottery.name,
      gameTypeName: share.pool.gameType.name,
      contestNumber: share.pool.contest.contestNumber,
      drawDate: share.pool.contest.drawDate.toISOString(),
      resultNumbers: share.pool.contest.result?.drawnNumbers ?? [],
      games: share.pool.games.map((game) => ({
        id: game.id,
        title: game.title,
        numbers: game.numbers,
        hits: game.hits ?? null,
        prizeAmount: game.prizeAmount?.toString() ?? null,
      })),
    },
  }));

  return (
    <AccountShell currentPath="/meus-jogos" title="Meus jogos" description="Acompanhe cotas compradas, concurso, status e prêmios distribuídos.">
      <MyGamesTable shares={shareRows} />
    </AccountShell>
  );
}
