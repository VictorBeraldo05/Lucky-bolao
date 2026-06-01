"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type PurchaseFormProps = {
  poolId: string;
  sharePrice: number;
  availableShares: number;
};

export function PurchaseForm({ poolId, sharePrice, availableShares }: PurchaseFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const total = sharePrice * quantity;

  async function handleAddToCart() {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/cart/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId, quantity }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message);
      return;
    }

    setMessage("Item adicionado ao carrinho.");
    window.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: {
          openDesktopDrawer: true,
        },
      }),
    );
    router.refresh();
  }

  return (
    <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/70 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Comprar cotas</p>
      <p className="mt-2 text-sm text-slate-600">Escolha a quantidade desejada e confirme sua participação usando o saldo da sua conta.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Quantidade
          <input
            type="number"
            min={1}
            max={availableShares}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(availableShares, Number(event.target.value) || 1)))}
            className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
          />
        </label>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">Disponiveis: {availableShares} cotas</p>
      <p className="mt-1 text-sm text-slate-500">Depois de adicionar ao carrinho, finalize a compra no carrinho com PIX.</p>
      {message ? <p className="mt-3 text-sm font-medium text-slate-700">{message}</p> : null}
      <button
        onClick={handleAddToCart}
        disabled={loading || availableShares < 1}
        className="mt-4 w-full rounded-full bg-fuchsia-600 px-5 py-3 font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-60"
      >
        {loading ? "Processando..." : "Adicionar ao carrinho"}
      </button>
    </div>
  );
}
