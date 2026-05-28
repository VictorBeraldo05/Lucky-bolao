import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [users, pools, transactions, prizes] = await prisma.$transaction([
    prisma.user.count(),
    prisma.pool.count(),
    prisma.walletTransaction.aggregate({ _sum: { amount: true } }),
    prisma.prize.aggregate({ _sum: { amount: true } }),
  ]);

  return (
    <AdminShell currentPath="/admin" title="Dashboard administrativo" description="Acompanhe vendas, saldos, prêmios e indicadores gerais da operação.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios" value={String(users)} />
        <StatCard label="Boloes" value={String(pools)} />
        <StatCard label="Fluxo financeiro" value={formatCurrency(transactions._sum.amount ?? 0)} />
        <StatCard label="Premios creditados" value={formatCurrency(prizes._sum.amount ?? 0)} />
      </div>
    </AdminShell>
  );
}
