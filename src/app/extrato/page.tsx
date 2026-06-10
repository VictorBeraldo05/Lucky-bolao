import { AccountShell } from "@/components/account-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StatementPage() {
  const user = await requireUser();
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell
      currentPath="/extrato"
      title="Extrato financeiro"
      description="Consulte todas as movimentações da sua conta com datas, valores e descrições."
    >
      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-fuchsia-500">{transaction.type}</p>
              </div>
              <p className="text-base font-bold text-slate-900">{formatCurrency(transaction.amount)}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Data</p>
                <p className="mt-1">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Saldo antes</p>
                <p className="mt-1">{formatCurrency(transaction.balanceBefore)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Saldo depois</p>
                <p className="mt-1">{formatCurrency(transaction.balanceAfter)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Antes</th>
                <th className="px-4 py-3">Depois</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{formatDate(transaction.createdAt)}</td>
                  <td className="px-4 py-3">{transaction.type}</td>
                  <td className="px-4 py-3">{transaction.description}</td>
                  <td className="px-4 py-3">{formatCurrency(transaction.amount)}</td>
                  <td className="px-4 py-3">{formatCurrency(transaction.balanceBefore)}</td>
                  <td className="px-4 py-3">{formatCurrency(transaction.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AccountShell>
  );
}
