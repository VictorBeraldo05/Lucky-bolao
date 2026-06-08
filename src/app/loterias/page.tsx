import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Loterias Online",
  description: "Conheça as modalidades disponíveis, veja concursos e encontre bolões online para participar com mais praticidade.",
  path: "/loterias",
  keywords: ["loterias online", "bolões online", "lotofácil online", "loterias caixa"],
});

export default async function LoteriasPage() {
  const lotteries = await prisma.lottery.findMany({
    include: {
      gameTypes: true,
      contests: { take: 1, orderBy: { drawDate: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <Container className="space-y-8 py-10">
      <SectionHeading
        eyebrow="Loterias"
        title="Escolha sua modalidade"
        description="Encontre a loteria ideal para você e acompanhe os bolões disponíveis em cada concurso."
      />

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Bolões online para quem busca praticidade</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
          <p>
            Nesta página você encontra as modalidades cadastradas na plataforma e pode navegar até os bolões
            disponíveis de cada loteria. Hoje o foco principal está em <strong>bolão Lotofácil online</strong>, mas a
            estrutura já está preparada para expansão para outras loterias.
          </p>
          <p>
            Se você procura <strong>loterias online</strong> com compra de cotas, resultados e acompanhamento em um só
            lugar, esta seção ajuda a entender a modalidade, o intervalo de dezenas e os próximos concursos de cada
            opção disponível.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {lotteries.map((lottery) => (
          <article key={lottery.id} className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{lottery.name}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{lottery.description}</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Faixa:</span> {lottery.numberStart} a {lottery.numberEnd}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Aposta:</span> {lottery.minNumbers} a {lottery.maxNumbers} dezenas
              </p>
              <p>
                <span className="font-semibold text-slate-900">Tipos:</span> {lottery.gameTypes.length}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Sorteios:</span> {lottery.drawDays.join(", ")}
              </p>
            </div>
            <Link
              href={lottery.slug === "lotofacil" ? "/loterias/lotofacil" : "/"}
              className="mt-5 inline-flex rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Ver bolões
            </Link>
          </article>
        ))}
      </div>
    </Container>
  );
}
