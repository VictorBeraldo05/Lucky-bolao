import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { formatDate } from "@/lib/utils";

export default async function AdminLogsPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    include: { actor: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell currentPath="/admin/logs" title="Logs e auditoria" description="Consulte o histórico de acessos, compras, alterações e movimentações registradas.">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Ator</th>
                <th className="px-4 py-3">Entidade</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.actor?.name ?? "Sistema"}</td>
                  <td className="px-4 py-3">{log.entityType}:{log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
