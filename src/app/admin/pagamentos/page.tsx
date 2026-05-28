import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = await prisma.payment.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });

  return (
    <AdminShell currentPath="/admin/pagamentos" title="Pagamentos e créditos" description="Gerencie créditos, pagamentos e o histórico financeiro das contas.">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{payment.user.name}</td>
                  <td className="px-4 py-3">{payment.method}</td>
                  <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                  <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
