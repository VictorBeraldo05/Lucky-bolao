"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminResultFormProps = {
  contests: { id: string; label: string }[];
};

export function AdminResultForm({ contests }: AdminResultFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);

    const response = await fetch("/api/admin/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contestId: formData.get("contestId"),
        drawnNumbers: String(formData.get("drawnNumbers"))
          .split(",")
          .map((value) => Number(value.trim()))
          .filter(Boolean),
        prizeBreakdown: {
          11: Number(formData.get("prize11") || 0),
          12: Number(formData.get("prize12") || 0),
          13: Number(formData.get("prize13") || 0),
          14: Number(formData.get("prize14") || 0),
          15: Number(formData.get("prize15") || 0),
        },
        source: formData.get("source"),
      }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-3 rounded-[28px] border border-white/80 bg-white p-5 shadow-sm lg:grid-cols-3">
      <select name="contestId" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 lg:col-span-1">
        {contests.map((contest) => (
          <option key={contest.id} value={contest.id}>
            {contest.label}
          </option>
        ))}
      </select>
      <input name="drawnNumbers" type="text" placeholder="Números sorteados separados por vírgula" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 lg:col-span-2" />
      <input name="prize11" type="number" min={0} step="0.01" placeholder="Prêmio 11 acertos" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <input name="prize12" type="number" min={0} step="0.01" placeholder="Prêmio 12 acertos" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <input name="prize13" type="number" min={0} step="0.01" placeholder="Prêmio 13 acertos" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <input name="prize14" type="number" min={0} step="0.01" placeholder="Prêmio 14 acertos" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <input name="prize15" type="number" min={0} step="0.01" placeholder="Prêmio 15 acertos" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <input name="source" type="text" placeholder="Fonte ou observação" defaultValue="Resultado conferido e publicado" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <button className="rounded-full bg-fuchsia-600 px-5 py-3 font-semibold text-white lg:col-span-3">Publicar resultado e distribuir prêmios</button>
      {message ? <p className="text-sm text-slate-600 lg:col-span-3">{message}</p> : null}
    </form>
  );
}
