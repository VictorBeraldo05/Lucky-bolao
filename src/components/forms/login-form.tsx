"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(data.message);
      return;
    }

    router.push("/minha-conta");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input name="email" type="email" placeholder="Seu e-mail" className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none ring-0" />
      <input name="password" type="password" placeholder="Sua senha" className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none ring-0" />
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      <button disabled={loading} className="w-full rounded-full bg-fuchsia-600 px-5 py-3 font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-70">
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

