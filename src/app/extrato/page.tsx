import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StatementPage() {
  const user = await requireUser();
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell currentPath="/extrato" title="Extrato financeiro" description="Consulte todas as movimentações da sua conta com datas, valores e descrições.">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
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
