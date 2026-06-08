"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterFormProps = {
  referralCode?: string | null;
};

export function RegisterForm({ referralCode }: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password"),
        cpf: formData.get("cpf"),
        referralCode,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input
        name="name"
        type="text"
        placeholder="Seu nome completo"
        className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
      />
      <input
        name="email"
        type="email"
        placeholder="Seu e-mail"
        className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
      />
      <input
        name="cpf"
        type="text"
        placeholder="CPF (somente números)"
        className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Telefone com DDD"
        className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
      />
      <input
        name="password"
        type="password"
        placeholder="Crie uma senha"
        className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
      />
      {referralCode ? (
        <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-800">
          Você entrou por um link de convite. Na sua primeira compra, quem te convidou recebe R$ 5,00 de crédito
          promocional.
        </div>
      ) : null}
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      <button
        disabled={loading}
        className="w-full rounded-full bg-fuchsia-600 px-5 py-3 font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-70"
      >
        {loading ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
