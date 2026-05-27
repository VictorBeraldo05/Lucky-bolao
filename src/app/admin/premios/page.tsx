import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminPrizesPage() {
  await requireAdmin();
  const prizes = await prisma.prize.findMany({
    include: { user: true, pool: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell currentPath="/admin/premios" title="Prêmios" description="Créditos distribuídos na carteira com rastreabilidade por bolão, usuário e acertos.">
      <div className="space-y-4">
        {prizes.map((prize) => (
          <div key={prize.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">{prize.user.name}</p>
                <p className="text-sm text-slate-500">{prize.pool.title}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatCurrency(prize.amount)}</p>
                <p className="text-sm text-slate-500">{formatDate(prize.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

