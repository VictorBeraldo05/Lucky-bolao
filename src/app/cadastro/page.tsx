import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/register-form";
import { Container } from "@/components/container";
import { getCurrentUser } from "@/lib/auth";

type RegisterPageProps = {
  searchParams?: Promise<{ ref?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();
  if (user) redirect("/minha-conta");

  const params = await searchParams;
  const referralCode = params?.ref?.trim() || null;

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-lg rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Cadastro</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Crie sua conta</h1>
        <p className="mt-3 text-slate-600">
          Crie sua conta para comprar cotas, acompanhar resultados e manter seus comprovantes e movimentações sempre
          organizados.
        </p>
        <div className="mt-4 rounded-2xl bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-700">
          Sua área pessoal reúne jogos, saldo, extrato e notificações em um só lugar.
        </div>
        <div className="mt-6">
          <RegisterForm referralCode={referralCode} />
        </div>
      </div>
    </Container>
  );
}
