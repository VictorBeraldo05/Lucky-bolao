import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPoolsPage() {
  await requireAdmin();
  const pools = await prisma.pool.findMany({
    include: { contest: true, lottery: true, gameType: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell currentPath="/admin/boloes" title="Bolões" description="Gestão de catálogo, cotas, status, jogos e comprovantes por concurso.">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Concurso</th>
                <th className="px-4 py-3">Cota</th>
                <th className="px-4 py-3">Disponibilidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool) => (
                <tr key={pool.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{pool.code}</td>
                  <td className="px-4 py-3">{pool.title}</td>
                  <td className="px-4 py-3">#{pool.contest.contestNumber}</td>
                  <td className="px-4 py-3">{formatCurrency(pool.sharePrice)}</td>
                  <td className="px-4 py-3">{pool.availableShares}/{pool.totalShares}</td>
                  <td className="px-4 py-3"><StatusBadge status={pool.status} /></td>
                  <td className="px-4 py-3"><Link href={`/boloes/${pool.code}`} className="font-semibold text-fuchsia-700">Visualizar</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

