import { ReferralLinkCard } from "@/components/referral-link-card";
import { AccountShell } from "@/components/account-shell";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getWalletAvailableBalance, getWalletBonusBalance } from "@/lib/utils";

export default async function MyAccountPage() {
  const user = await requireUser();
  await syncPendingCartPaymentsForUser(user.id);

  const [purchases, prizes, notifications] = await Promise.all([
    prisma.purchase.count({ where: { userId: user.id } }),
    prisma.prize.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <AccountShell
      currentPath="/minha-conta"
      title={`Olá, ${user.name}`}
      description="Sua visão geral de saldo, compras, prêmios e notificações."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saldo atual" value={formatCurrency(getWalletAvailableBalance(user.wallet))} />
        <StatCard label="Compras" value={String(purchases)} />
        <StatCard label="Prêmios" value={formatCurrency(prizes._sum.amount ?? 0)} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <StatCard label="Crédito promocional" value={formatCurrency(getWalletBonusBalance(user.wallet))} />
        <StatCard label="Disponível para novas cotas" value={formatCurrency(getWalletAvailableBalance(user.wallet))} />
      </div>

      <div className="mt-6">
        <ReferralLinkCard inviteCode={user.inviteCode} />
      </div>

      <div className="mt-6 rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Últimas notificações</h2>
        <div className="mt-4 space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4">
              <p className="font-semibold text-slate-900">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
            </div>
          ))}
        </div>
      </div>
    </AccountShell>
  );
}
