import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { NumberGrid } from "@/components/number-grid";
import { SectionHeading } from "@/components/section-heading";

export default async function LotofacilPage() {
  const [lottery, openPools] = await Promise.all([
    prisma.lottery.findUnique({
      where: { slug: "lotofacil" },
      include: { gameTypes: true, contests: { take: 3, orderBy: { drawDate: "asc" } } },
    }),
    prisma.pool.findMany({
      where: { lottery: { slug: "lotofacil" }, status: "OPEN" },
      take: 2,
      include: { contest: true, games: true, gameType: true, lottery: true },
    }),
  ]);

  return (
    <Container className="py-10 space-y-8">
      <SectionHeading eyebrow="Lotofacil" title="Bolões da Lotofácil" description="Encontre bolões com diferentes composições para participar da Lotofácil do jeito que preferir." />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Regras base</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p><span className="font-semibold text-slate-900">Numeros:</span> 1 a 25</p>
            <p><span className="font-semibold text-slate-900">Aposta:</span> 15 a 20 dezenas</p>
            <p><span className="font-semibold text-slate-900">Tipos ativos:</span> {lottery?.gameTypes.length ?? 0}</p>
            <p><span className="font-semibold text-slate-900">Dias:</span> {lottery?.drawDays.join(", ")}</p>
          </div>
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-slate-800">Grade oficial</p>
            <NumberGrid numbers={Array.from({ length: 25 }, (_, index) => index + 1)} />
          </div>
        </section>

        <section className="rounded-[32px] border border-fuchsia-100 bg-linear-to-b from-fuchsia-50 to-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Proximos concursos</h2>
          <div className="mt-4 space-y-4">
            {lottery?.contests.map((contest) => (
              <div key={contest.id} className="rounded-[24px] bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">Concurso #{contest.contestNumber}</p>
                <p className="mt-1 text-sm text-slate-600">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(contest.drawDate)}</p>
              </div>
            ))}
          </div>
          <Link href="/loterias/lotofacil/boloes" className="mt-6 inline-flex rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white">
            Ver bolões disponiveis
          </Link>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {openPools.map((pool) => (
          <div key={pool.id} className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{pool.gameType.name}</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{pool.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{pool.description}</p>
            <Link href={`/boloes/${pool.code}`} className="mt-5 inline-flex rounded-full border border-fuchsia-200 px-5 py-3 text-sm font-semibold text-fuchsia-700">
              Ver detalhes
            </Link>
          </div>
        ))}
      </div>
    </Container>
  );
}
