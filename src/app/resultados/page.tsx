import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { NumberGrid } from "@/components/number-grid";
import { SectionHeading } from "@/components/section-heading";
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
    <Container className="space-y-8 py-10">
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{result.contest.lottery.name}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Concurso #{result.contest.contestNumber}</h2>
              <div className="mt-4">
                <NumberGrid numbers={result.drawnNumbers} highlight={result.drawnNumbers} />
              </div>
            </article>
          ))
        )}
      </div>
    </Container>
  );
}
