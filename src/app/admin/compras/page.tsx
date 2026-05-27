import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminPurchasesPage() {
  await requireAdmin();
  const purchases = await prisma.purchase.findMany({
    include: { user: true, items: { include: { pool: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell currentPath="/admin/compras" title="Compras" description="Registro centralizado das compras de cotas e seus itens relacionados.">
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">{purchase.user.name}</p>
                <p className="text-sm text-slate-500">{formatDate(purchase.createdAt)}</p>
              </div>
              <p className="font-semibold text-slate-900">{formatCurrency(purchase.totalAmount)}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

