"use client";

import { FormEvent, useState } from "react";

type ProfileCpfFormProps = {
  initialCpf?: string | null;
};

export function ProfileCpfForm({ initialCpf }: ProfileCpfFormProps) {
  const [cpf, setCpf] = useState(initialCpf ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "Falha ao atualizar CPF.");
      } else {
        setMessage(data.message ?? "CPF atualizado com sucesso.");
        window.location.reload();
      }
    } catch {
      setMessage("Erro ao atualizar CPF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/70 p-5">
      <p className="text-sm font-semibold text-slate-900">CPF para depositos</p>
      <input
        name="cpf"
        value={cpf}
        onChange={(event) => setCpf(event.target.value)}
        placeholder="Informe seu CPF"
        className="w-full rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 outline-none"
      />
      {message ? <p className="text-sm font-medium text-slate-700">{message}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Atualizar CPF"}
      </button>
    </form>
  );
}
