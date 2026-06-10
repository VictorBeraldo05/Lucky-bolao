import { AccountShell } from "@/components/account-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function WithdrawalsPage() {
  const user = await requireUser();
  const prizes = await prisma.prize.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell
      currentPath="/resgates"
      title="Resgates e prêmios"
      description="Acompanhe os valores recebidos e o histórico dos seus prêmios."
    >
      <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Histórico de prêmios</h2>
        <div className="mt-4 space-y-3">
          {prizes.length === 0 ? (
            <p className="text-slate-500">Nenhum prêmio creditado ainda.</p>
          ) : (
            prizes.map((prize) => (
              <div key={prize.id} className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{prize.description}</p>
                    <p className="text-sm text-slate-500">{prize.hitCount} acertos</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(prize.amount)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AccountShell>
  );
}
