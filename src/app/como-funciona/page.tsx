import type { Metadata } from "next";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Como Funciona o Bolão Online",
  description: "Entenda como criar conta, comprar cotas, acompanhar sorteios e consultar seus jogos na Lucky Bolões.",
  path: "/como-funciona",
  keywords: ["como funciona bolão online", "comprar cota lotofácil", "como participar de bolão"],
});

const steps = [
  "Crie sua conta em poucos instantes e acesse sua área pessoal.",
  "Adicione saldo para comprar cotas dos bolões disponíveis.",
  "Escolha o bolão, defina a quantidade de cotas e confirme sua participação.",
  "Acompanhe sorteios, resultados, prêmios, comprovantes e movimentações sempre que quiser.",
];

export default function HowItWorksPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Como participar de um bolão da Lotofácil?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Crie sua conta, escolha um bolão disponível, defina a quantidade de cotas e finalize o pagamento.",
        },
      },
      {
        "@type": "Question",
        name: "Onde acompanho meus jogos e resultados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depois da compra, você acompanha seus jogos, resultados, comprovantes e prêmios na sua área da conta.",
        },
      },
      {
        "@type": "Question",
        name: "Como recebo prêmios em um bolão?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Quando o bolão é premiado, o sistema calcula a divisão proporcional por cotas e registra o valor na carteira do usuário.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="space-y-4 px-4 py-4 md:hidden">
        <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">Passo a passo</p>
          <h1 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900">
            Como funciona
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Da escolha do bolão ao acompanhamento do sorteio, tudo acontece de forma simples.
          </p>
        </section>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm">
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-fuchsia-100 px-3 text-sm font-bold text-fuchsia-700">
                {index + 1}
              </span>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-900">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <Container className="hidden space-y-8 py-10 md:block">
        <SectionHeading
          eyebrow="Passo a passo"
          title="Como funciona"
          description="Da escolha do bolão ao acompanhamento do resultado, tudo acontece de forma simples e organizada."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step} className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Passo {index + 1}</p>
              <p className="mt-3 text-lg text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
