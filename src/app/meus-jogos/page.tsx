import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { StatusBadge } from "@/components/status-badge";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function MyGamesPage() {
  const user = await requireUser();
  await syncPendingCartPaymentsForUser(user.id);
  const shares = await prisma.poolShare.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        include: {
          lottery: true,
          contest: true,
          gameType: true,
        },
      },
      prizes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell currentPath="/meus-jogos" title="Meus jogos" description="Acompanhe cotas compradas, concurso, status e prêmios distribuídos.">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Loteria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concurso</th>
                <th className="px-4 py-3">Cotas</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prêmio</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => (
                <tr key={share.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{share.pool.lottery.name}</td>
                  <td className="px-4 py-3">{share.pool.gameType.name}</td>
                  <td className="px-4 py-3">#{share.pool.contest.contestNumber}<div className="text-xs text-slate-500">{formatDate(share.pool.contest.drawDate)}</div></td>
                  <td className="px-4 py-3">{share.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(share.totalPrice)}</td>
                  <td className="px-4 py-3"><StatusBadge status={share.pool.status} /></td>
                  <td className="px-4 py-3">{formatCurrency(share.prizes.reduce((sum, item) => sum + Number(item.amount), 0))}</td>
                  <td className="px-4 py-3">
                    <Link href={`/boloes/${share.pool.code}`} className="font-semibold text-fuchsia-700">
                      Ver jogo
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AccountShell>
  );
}
