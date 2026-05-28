import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { Container } from "@/components/container";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/minha-conta");

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-lg rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Entrar</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Acesse sua conta</h1>
        <p className="mt-3 text-slate-600">Entre para acompanhar bolões, consultar comprovantes e ver seu saldo e histórico sempre que quiser.</p>
        <div className="mt-4 rounded-2xl bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-700">
          Tudo o que você compra e acompanha fica reunido na sua área pessoal.
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
