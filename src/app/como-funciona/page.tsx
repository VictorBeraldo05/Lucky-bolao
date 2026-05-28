import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  "Cadastre-se e receba uma conta com carteira individual.",
  "Adicione saldo à sua conta para participar dos bolões.",
  "Escolha um bolão, defina quantas cotas deseja e finalize usando o saldo disponível.",
  "Acompanhe sorteios, acertos, prêmios, comprovantes e histórico completo de movimentações.",
];

export default function HowItWorksPage() {
  return (
    <Container className="py-10 space-y-8">
      <SectionHeading eyebrow="Passo a passo" title="Como funciona" description="Tudo foi pensado para que sua participação nos bolões seja simples, rápida e transparente." />
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
