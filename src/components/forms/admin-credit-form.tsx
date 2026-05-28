"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminCreditFormProps = {
  users: { id: string; name: string; email: string }[];
};

export function AdminCreditForm({ users }: AdminCreditFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);

    const response = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: formData.get("userId"),
        amount: Number(formData.get("amount")),
        description: formData.get("description"),
      }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-3 rounded-[28px] border border-white/80 bg-white p-5 shadow-sm lg:grid-cols-4">
      <select name="userId" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3">
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
      <input name="amount" type="number" min={1} step="0.01" placeholder="Valor" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <input name="description" type="text" placeholder="Descricao" defaultValue="Credito adicionado à conta" className="rounded-2xl border border-fuchsia-100 bg-white px-4 py-3" />
      <button className="rounded-full bg-fuchsia-600 px-5 py-3 font-semibold text-white">Creditar carteira</button>
      {message ? <p className="lg:col-span-4 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
