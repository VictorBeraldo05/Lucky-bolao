import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { formatDate } from "@/lib/utils";

export default async function AdminContestsPage() {
  await requireAdmin();
  const contests = await prisma.contest.findMany({
    include: { lottery: true, result: true, pools: true },
    orderBy: { drawDate: "asc" },
  });

  return (
    <AdminShell currentPath="/admin/concursos" title="Concursos" description="Controle de agenda de sorteios e vínculo com bolões e resultados.">
      <div className="space-y-4">
        {contests.map((contest) => (
          <div key={contest.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-900">{contest.lottery.name} #{contest.contestNumber}</p>
                <p className="text-sm text-slate-500">{formatDate(contest.drawDate)}</p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{contest.result ? "Resultado lançado" : "Aguardando"}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

