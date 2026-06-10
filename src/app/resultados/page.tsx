import type { Metadata } from "next";
import { Container } from "@/components/container";
import { NumberGrid } from "@/components/number-grid";
import { SectionHeading } from "@/components/section-heading";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Resultados da Lotofácil e Premiações",
  description: "Consulte resultados da Lotofácil, dezenas sorteadas e bolões premiados em uma página organizada.",
  path: "/resultados",
  keywords: ["resultado lotofácil", "resultados loteria caixa", "bolões premiados", "dezenas sorteadas"],
});

export default async function ResultsPage() {
  const results = await prisma.contestResult.findMany({
    include: {
      contest: {
        include: {
          lottery: true,
          pools: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <>
      <div className="space-y-4 px-4 py-4 md:hidden">
        <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">Resultados</p>
          <h1 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900">
            Sorteios e premiações
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Confira os últimos concursos da Lotofácil e veja as dezenas sorteadas sem complicação.
          </p>
        </section>

        {results.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-fuchsia-200 bg-white/95 p-8 text-center text-sm text-slate-500 shadow-sm">
            Nenhum resultado foi publicado até o momento.
          </div>
        ) : (
          results.map((result) => (
            <article key={result.id} className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-500">
                    {result.contest.lottery.name}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Concurso #{result.contest.contestNumber}
                  </h2>
                </div>
                <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                  {result.drawnNumbers.length} dezenas
                </span>
              </div>

              <div className="mt-4">
                <NumberGrid numbers={result.drawnNumbers} highlight={result.drawnNumbers} size="sm" />
              </div>
            </article>
          ))
        )}
      </div>

      <Container className="hidden space-y-8 py-10 md:block">
        <SectionHeading
          eyebrow="Resultados"
          title="Resultados e premiações"
          description="Consulte os números sorteados e acompanhe os bolões premiados de forma clara e organizada."
        />
        <div className="space-y-5">
          {results.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-fuchsia-200 bg-white/70 p-10 text-center text-slate-500">
              Nenhum resultado foi publicado até o momento.
            </div>
          ) : (
            results.map((result) => (
              <article key={result.id} className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">
                  {result.contest.lottery.name}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Concurso #{result.contest.contestNumber}
                </h2>
                <div className="mt-4">
                  <NumberGrid numbers={result.drawnNumbers} highlight={result.drawnNumbers} />
                </div>
              </article>
            ))
          )}
        </div>
      </Container>
    </>
  );
}
