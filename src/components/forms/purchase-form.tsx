"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type PurchaseFormProps = {
  poolId: string;
  poolTitle: string;
  poolCode: string;
  sharePrice: number;
  availableShares: number;
};

export function PurchaseForm({ poolId, poolTitle, poolCode, sharePrice, availableShares }: PurchaseFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
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
      if (response.status === 401) {
        setShowAuthPrompt(true);
        return;
      }

      setMessage(data.message);
      return;
    }

    setMessage("Item adicionado ao carrinho.");
    window.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: {
          openDesktopDrawer: true,
          addedItem: {
            title: poolTitle,
            code: poolCode,
            quantity,
            total,
            href: `/boloes/${poolCode}`,
          },
        },
      }),
    );
    router.refresh();
  }

  return (
    <>
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
        <p className="mt-3 text-sm text-slate-500">Disponíveis: {availableShares} cotas</p>
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

      {showAuthPrompt ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" onClick={() => setShowAuthPrompt(false)}>
          <div
            className="w-full max-w-md rounded-[32px] border border-white/80 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Antes de continuar</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Entre para comprar sua cota</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Para adicionar cotas ao carrinho e concluir a compra, você precisa entrar na sua conta ou criar um cadastro rápido.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/login?redirect=/boloes/${poolCode}`}
                className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 px-5 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
              >
                Entrar
              </Link>
              <Link
                href={`/cadastro?redirect=/boloes/${poolCode}`}
                className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
