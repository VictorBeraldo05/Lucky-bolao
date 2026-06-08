import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { ReferralPromoBanner } from "@/components/referral-promo-banner";
import { SectionHeading } from "@/components/section-heading";
import { prisma } from "@/lib/prisma";
import { buildMetadata, getSiteUrl } from "@/lib/seo";
import { applyTemporaryPoolUrgencyMask } from "@/lib/temporary-pool-urgency";

export const metadata: Metadata = buildMetadata({
  title: "Bolão Lotofácil Online",
  description:
    "Participe de bolão Lotofácil online, compre cotas com rapidez e acompanhe resultados, comprovantes e seus jogos.",
  path: "/",
  keywords: ["bolão lotofácil", "bolao lotofacil", "lotofácil online", "cotas lotofácil", "bolão online"],
});

const faqItems = [
  {
    question: "Como funciona um bolão Lotofácil online?",
    answer:
      "Você escolhe um bolão disponível, compra a quantidade de cotas desejada e acompanha seus jogos, resultados e prêmios pela sua conta.",
  },
  {
    question: "Posso comprar cotas da Lotofácil pela internet?",
    answer:
      "Sim. Na Lucky Bolões, a compra das cotas acontece online, com visualização do bolão, quantidade de jogos, valor por cota e acompanhamento do concurso.",
  },
  {
    question: "Onde vejo os resultados dos meus bolões?",
    answer:
      "Depois da compra, você acompanha os sorteios, dezenas sorteadas, jogos comprados e eventuais premiações na área Meus Jogos.",
  },
  {
    question: "Bolão Lotofácil online é uma boa opção para entrar em mais jogos?",
    answer:
      "O bolão permite dividir o valor total de várias apostas em cotas, facilitando a participação em composições maiores de jogos da Lotofácil.",
  },
];

export default async function Home() {
  const [session, featuredPools] = await Promise.all([
    getSession(),
    prisma.pool.findMany({
      where: { status: "OPEN" },
      include: {
        lottery: true,
        gameType: true,
        contest: true,
        games: true,
      },
      take: 4,
      orderBy: [{ sharePrice: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const inviteUser = session?.sub
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: { inviteCode: true },
      })
    : null;

  const displayPools = featuredPools.map(applyTemporaryPoolUrgencyMask);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Bolão Lotofácil Online",
    url: getSiteUrl(),
    description: "Página principal com bolões da Lotofácil, cotas disponíveis e acesso rápido aos concursos.",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="pb-12 sm:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Container className="pt-1 pb-4 sm:py-8">
        <h1 className="sr-only">Bolão Lotofácil online para comprar cotas, acompanhar resultados e participar de concursos</h1>
        <ReferralPromoBanner inviteCode={inviteUser?.inviteCode ?? null} />
      </Container>

      <Container className="space-y-6">
        <SectionHeading
          eyebrow="Comprar agora"
          title="Bolões disponíveis"
          description="Escolha seu bolão Lotofácil online, compare cotas, valores e quantidade de jogos sem perder tempo."
          action={
            <Link href="/loterias/lotofacil/boloes" className="text-sm font-semibold text-fuchsia-600">
              Abrir listagem completa
            </Link>
          }
        />

        <PoolTable pools={displayPools} isAuthenticated={Boolean(session?.sub)} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Bolão lotofácil online</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Compre cotas da Lotofácil com mais clareza e praticidade</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
              <p>
                A Lucky Bolões foi criada para quem procura <strong>bolão Lotofácil online</strong> com visual claro,
                compra rápida de cotas e acompanhamento completo dos concursos. Em vez de procurar informações soltas,
                você visualiza o bolão, a composição dos jogos, o valor por cota e o status de cada concurso em um só
                lugar.
              </p>
              <p>
                Se a sua busca é por <strong>bolao lotofacil</strong>, <strong>cotas da Lotofácil</strong> ou uma forma
                mais prática de entrar em mais jogos, aqui você encontra uma experiência organizada para consultar
                dezenas, acompanhar sorteios e verificar resultados sem complicação.
              </p>
            </div>
          </article>

          <aside className="rounded-[32px] border border-fuchsia-100 bg-linear-to-b from-fuchsia-50 to-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Como participar</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Passos rápidos para entrar no próximo concurso</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-600 sm:text-base">
              <li>1. Escolha um bolão Lotofácil com o valor por cota que faz sentido para você.</li>
              <li>2. Veja a quantidade de jogos e a divisão de cotas antes de comprar.</li>
              <li>3. Finalize sua participação e acompanhe tudo em Meus Jogos.</li>
              <li>4. Consulte resultados, prêmios e comprovantes pela própria plataforma.</li>
            </ol>
          </aside>
        </section>

        <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Dúvidas frequentes</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Perguntas comuns sobre bolão Lotofácil</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/50 p-5">
                <h3 className="text-lg font-bold text-slate-900">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
