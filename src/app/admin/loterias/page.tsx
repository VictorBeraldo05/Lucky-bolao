import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLotteriesPage() {
  await requireAdmin();
  const lotteries = await prisma.lottery.findMany({ include: { gameTypes: true }, orderBy: { name: "asc" } });

  return (
    <AdminShell currentPath="/admin/loterias" title="Loterias" description="Base genérica para suportar múltiplos jogos e tipos de estratégia.">
      <div className="grid gap-4">
        {lotteries.map((lottery) => (
          <div key={lottery.id} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">{lottery.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{lottery.description}</p>
            <p className="mt-3 text-sm text-slate-500">Tipos ativos: {lottery.gameTypes.map((type) => type.name).join(", ")}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

