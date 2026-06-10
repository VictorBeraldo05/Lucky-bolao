import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { MobilePoolsList } from "@/components/mobile/mobile-pools-list";
import { NumberGrid } from "@/components/number-grid";
import { SectionHeading } from "@/components/section-heading";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { applyTemporaryPoolUrgencyMask } from "@/lib/temporary-pool-urgency";

export const metadata: Metadata = buildMetadata({
  title: "Lotofácil Online",
  description: "Veja como funciona a Lotofácil, próximos concursos e opções de bolões para participar online.",
  path: "/loterias/lotofacil",
  keywords: ["lotofácil online", "como jogar lotofácil", "próximo concurso lotofácil", "bolão lotofácil"],
});

export default async function LotofacilPage() {
  const [session, lottery, openPools] = await Promise.all([
    getSession(),
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

  const displayPools = openPools.map(applyTemporaryPoolUrgencyMask);

  return (
    <>
      <div className="space-y-4 px-4 py-4 md:hidden">
        <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">Lotofácil</p>
          <h1 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900">
            Entre nos próximos concursos
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="rounded-[20px] bg-fuchsia-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fuchsia-500">Números</p>
              <p className="mt-1 font-bold text-slate-900">1 a 25</p>
            </div>
            <div className="rounded-[20px] bg-fuchsia-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fuchsia-500">Aposta</p>
              <p className="mt-1 font-bold text-slate-900">15 a 20 dezenas</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Próximos concursos</p>
          <div className="mt-3 space-y-3">
            {lottery?.contests.map((contest) => (
              <div key={contest.id} className="rounded-[20px] border border-fuchsia-100 bg-fuchsia-50/50 p-4">
                <p className="font-bold text-slate-900">Concurso #{contest.contestNumber}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(contest.drawDate)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <MobilePoolsList
          pools={displayPools}
          isAuthenticated={Boolean(session?.sub)}
          title="Bolões da Lotofácil"
          eyebrow="Comprar agora"
          actionHref="/loterias/lotofacil/boloes"
          actionLabel="Ver todos"
        />
      </div>

      <Container className="hidden space-y-8 py-10 md:block">
        <SectionHeading
          eyebrow="Lotofácil"
          title="Bolões da Lotofácil"
          description="Confira concursos, dezenas e opções de participação para entrar na Lotofácil com praticidade."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Como funciona a Lotofácil</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Números:</span> 1 a 25
              </p>
              <p>
                <span className="font-semibold text-slate-900">Aposta:</span> 15 a 20 dezenas
              </p>
              <p>
                <span className="font-semibold text-slate-900">Tipos ativos:</span> {lottery?.gameTypes.length ?? 0}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Dias:</span> {lottery?.drawDays.join(", ")}
              </p>
            </div>
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-slate-800">Grade oficial</p>
              <NumberGrid numbers={Array.from({ length: 25 }, (_, index) => index + 1)} />
            </div>
          </section>

          <section className="rounded-[32px] border border-fuchsia-100 bg-linear-to-b from-fuchsia-50 to-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Próximos concursos</h2>
            <div className="mt-4 space-y-4">
              {lottery?.contests.map((contest) => (
                <div key={contest.id} className="rounded-[24px] bg-white p-4 shadow-sm">
                  <p className="text-lg font-bold text-slate-900">Concurso #{contest.contestNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(contest.drawDate)}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/loterias/lotofacil/boloes"
              className="mt-6 inline-flex rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Ver bolões disponíveis
            </Link>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {displayPools.map((pool) => (
            <div key={pool.id} className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{pool.gameType.name}</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{pool.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{pool.description}</p>
              <Link
                href={`/boloes/${pool.code}`}
                className="mt-5 inline-flex rounded-full border border-fuchsia-200 px-5 py-3 text-sm font-semibold text-fuchsia-700"
              >
                Ver detalhes
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
