import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  "Crie sua conta em poucos instantes e acesse sua área pessoal.",
  "Adicione saldo para comprar cotas dos bolões disponíveis.",
  "Escolha o bolão, defina a quantidade de cotas e confirme sua participação.",
  "Acompanhe sorteios, resultados, prêmios, comprovantes e movimentações sempre que quiser.",
];

export default function HowItWorksPage() {
  return (
    <Container className="space-y-8 py-10">
      <SectionHeading eyebrow="Passo a passo" title="Como funciona" description="Da escolha do bolão ao acompanhamento do resultado, tudo acontece de forma simples e organizada." />
      <div className="grid gap-5 lg:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step} className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Passo {index + 1}</p>
            <p className="mt-3 text-lg text-slate-700">{step}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
