import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { formatCurrency } from "@/lib/utils";

export default async function WithdrawalsPage() {
  const user = await requireUser();
  const prizes = await prisma.prize.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell currentPath="/resgates" title="Resgates e prêmios" description="No MVP, o prêmio é creditado diretamente na carteira, mantendo rastreabilidade da distribuição.">
      <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Histórico de prêmios</h2>
        <div className="mt-4 space-y-3">
          {prizes.length === 0 ? (
            <p className="text-slate-500">Nenhum prêmio creditado ainda.</p>
          ) : (
            prizes.map((prize) => (
              <div key={prize.id} className="flex items-center justify-between rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{prize.description}</p>
                  <p className="text-sm text-slate-500">{prize.hitCount} acertos</p>
                </div>
                <p className="font-semibold text-slate-900">{formatCurrency(prize.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </AccountShell>
  );
}
