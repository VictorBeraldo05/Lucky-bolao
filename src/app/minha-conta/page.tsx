import { AccountShell } from "@/components/account-shell";
import { ReferralLinkCard } from "@/components/referral-link-card";
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

  const availableBalance = formatCurrency(getWalletAvailableBalance(user.wallet));
  const totalPrizes = formatCurrency(prizes._sum.amount ?? 0);
  const bonusBalance = formatCurrency(getWalletBonusBalance(user.wallet));

  return (
    <AccountShell
      currentPath="/minha-conta"
      title={`Olá, ${user.name}`}
      description="Sua visão geral de saldo, compras, prêmios e notificações."
    >
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Saldo atual</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{availableBalance}</p>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Prêmios</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{totalPrizes}</p>
        </div>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        <StatCard label="Saldo atual" value={availableBalance} />
        <StatCard label="Compras" value={String(purchases)} />
        <StatCard label="Prêmios" value={totalPrizes} />
      </div>

      <div className="mt-6 hidden gap-4 md:grid md:grid-cols-2">
        <StatCard label="Crédito promocional" value={bonusBalance} />
        <StatCard label="Disponível para novas cotas" value={availableBalance} />
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
