import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { StatCard } from "@/components/stat-card";
import { WalletTopupPanel } from "@/components/wallet-topup-panel";
import { formatCurrency } from "@/lib/utils";

export default async function WalletPage() {
  const user = await requireUser();
  const [packages, payments, transactions] = await Promise.all([
    prisma.walletPackage.findMany({ orderBy: { price: "asc" } }),
    prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.walletTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <AccountShell currentPath="/carteira" title="Carteira e créditos" description="Acompanhe seu saldo, créditos recebidos e movimentações da conta.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saldo disponível" value={formatCurrency(user.wallet?.balance ?? 0)} />
        <StatCard label="Pagamentos aprovados" value={String(payments.filter((item) => item.status === "APPROVED").length)} />
        <StatCard label="Transações recentes" value={String(transactions.length)} />
      </div>

      <div className="mt-6">
        <WalletTopupPanel packages={packages} userCpf={user.cpf ?? null} />
      </div>

      <div className="mt-6 rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Ultimos créditos</h2>
        <div className="mt-4 space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4">
              <div>
                <p className="font-semibold text-slate-900">{payment.method}</p>
                <p className="text-sm text-slate-500">{payment.status}</p>
              </div>
              <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </AccountShell>
  );
}
