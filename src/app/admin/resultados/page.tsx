import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminResultForm } from "@/components/forms/admin-result-form";
import { NumberGrid } from "@/components/number-grid";

export default async function AdminResultsPage() {
  await requireAdmin();
  const [contests, results] = await Promise.all([
    prisma.contest.findMany({ include: { lottery: true }, orderBy: { drawDate: "asc" } }),
    prisma.contestResult.findMany({
      include: { contest: { include: { lottery: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <AdminShell currentPath="/admin/resultados" title="Resultados" description="Lançamento manual do concurso com conferência automática e distribuição proporcional de prêmios.">
      <AdminResultForm contests={contests.map((contest) => ({ id: contest.id, label: `${contest.lottery.name} #${contest.contestNumber}` }))} />
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <p className="text-lg font-bold text-slate-900">{result.contest.lottery.name} #{result.contest.contestNumber}</p>
            <div className="mt-4">
              <NumberGrid numbers={result.drawnNumbers} highlight={result.drawnNumbers} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

