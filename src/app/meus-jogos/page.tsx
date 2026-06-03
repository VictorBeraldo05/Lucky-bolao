import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { MyGamesTable } from "@/components/my-games-table";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";

export default async function MyGamesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  await syncPendingCartPaymentsForUser(user.id);
  const resolvedSearchParams = (await searchParams) ?? {};
  const paymentStatus = Array.isArray(resolvedSearchParams.payment)
    ? resolvedSearchParams.payment[0]
    : resolvedSearchParams.payment;

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
      {paymentStatus === "approved" ? (
        <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Pagamento aprovado</p>
          <p className="mt-2 text-base font-semibold">Suas cotas foram liberadas com sucesso e já estão disponíveis em seus jogos.</p>
        </div>
      ) : null}
      <MyGamesTable shares={shareRows} />
    </AccountShell>
  );
}
