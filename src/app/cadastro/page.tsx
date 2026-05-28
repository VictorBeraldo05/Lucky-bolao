import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/register-form";
import { Container } from "@/components/container";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/minha-conta");

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-lg rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Cadastro</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Crie sua conta</h1>
        <p className="mt-3 text-slate-600">Crie sua conta para acompanhar bolões, saldo, resultados e comprovantes em um só lugar.</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </Container>
  );
}
