import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activePoolStatuses } from "@/lib/status";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { SectionHeading } from "@/components/section-heading";
import { buildMetadata } from "@/lib/seo";
import { applyTemporaryPoolUrgencyMask } from "@/lib/temporary-pool-urgency";

export const metadata: Metadata = buildMetadata({
  title: "Bolões da Lotofácil",
  description: "Confira os bolões da Lotofácil, compare cotas, valores e jogos disponíveis para participar online.",
  path: "/loterias/lotofacil/boloes",
  keywords: ["bolões da lotofácil", "bolão lotofácil online", "comprar cota lotofácil", "cotas lotofácil"],
});

const contentBlocks = [
  {
    title: "Compare cotas antes de comprar",
    text:
      "A listagem de bolões da Lotofácil mostra valor por cota, divisão de cotas, quantidade de jogos e detalhes da composição para ajudar na decisão de compra.",
  },
  {
    title: "Acompanhe seus concursos online",
    text:
      "Depois da compra, o usuário acompanha o bolão Lotofácil, o resultado do concurso, os jogos comprados e os comprovantes diretamente pela plataforma.",
  },
  {
    title: "Mais clareza para escolher o bolão",
    text:
      "Quem procura bolão Lotofácil online normalmente quer comparar opções sem perder tempo. Por isso, a tabela destaca o que é mais importante na escolha.",
  },
];

export default async function LotofacilPoolsPage() {
  const [session, pools] = await Promise.all([
    getSession(),
    prisma.pool.findMany({
      where: {
        lottery: { slug: "lotofacil" },
        status: { in: activePoolStatuses },
      },
      include: {
        contest: true,
        lottery: true,
        gameType: true,
        games: true,
      },
      orderBy: [{ status: "asc" }, { contest: { drawDate: "asc" } }],
    }),
  ]);

  const displayPools = pools.map(applyTemporaryPoolUrgencyMask);

  return (
    <Container className="space-y-8 py-10">
      <SectionHeading
        eyebrow="Bolões"
        title="Listagem da Lotofácil"
        description="Confira os bolões disponíveis, escolha suas cotas e acompanhe tudo pela sua conta."
      />

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bolão Lotofácil online com compra de cotas</h1>
        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
          <p>
            Se você busca <strong>bolão Lotofácil online</strong>, esta página reúne os bolões disponíveis para o
            próximo concurso com foco em clareza de informação. Aqui você compara <strong>valor por cota</strong>,
            quantidade de jogos, divisão das cotas e abertura para compra sem precisar procurar os detalhes em várias
            telas.
          </p>
          <p>
            A ideia é facilitar a entrada em <strong>cotas da Lotofácil</strong> com um fluxo simples: escolher o
            bolão, revisar os jogos, comprar suas cotas e acompanhar resultados, comprovantes e prêmios pela área da
            conta.
          </p>
        </div>
      </section>

      <PoolTable pools={displayPools} isAuthenticated={Boolean(session?.sub)} />

      <section className="grid gap-5 lg:grid-cols-3">
        {contentBlocks.map((item) => (
          <article key={item.title} className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{item.text}</p>
          </article>
        ))}
      </section>
    </Container>
  );
}
