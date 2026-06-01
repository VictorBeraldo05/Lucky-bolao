"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type CartItemProps = {
  id: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  pool: {
    id: string;
    title: string;
    code: string;
  };
};

type CartItemsTableProps = {
  initialItems: CartItemProps[];
  onCartChange?: (items: CartItemProps[]) => void;
};

export function CartItemsTable({ initialItems, onCartChange }: CartItemsTableProps) {
  const [items, setItems] = useState<CartItemProps[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.totalPrice), 0), [items]);

  async function updateItem(itemId: string, quantity: number) {
    setLoadingId(itemId);
    setMessage(null);
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "Falha ao atualizar item.");
        return;
      }
      const nextItems = items.map((item) => (item.id === itemId ? { ...item, quantity: data.item.quantity, totalPrice: data.item.totalPrice } : item));
      setItems(nextItems);
      onCartChange?.(nextItems);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      setMessage("Erro de rede ao atualizar item.");
    } finally {
      setLoadingId(null);
    }
  }

  async function removeItem(itemId: string) {
    setLoadingId(itemId);
    setMessage(null);
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "Falha ao remover item.");
        return;
      }
      const nextItems = items.filter((item) => item.id !== itemId);
      setItems(nextItems);
      onCartChange?.(nextItems);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      setMessage("Erro de rede ao remover item.");
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/70 p-6 text-center text-sm text-slate-600">Seu carrinho esta vazio.</p>;
  }

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Itens no carrinho</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{item.pool.title}</p>
                <p className="text-sm text-slate-500">Bolão {item.pool.code}</p>
              </div>
              <p className="text-sm text-slate-500">Unitário: {formatCurrency(Number(item.unitPrice))}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Quantidade
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => {
                    const nextQuantity = Math.max(1, Number(event.target.value) || 1);
                    updateItem(item.id, nextQuantity);
                  }}
                  className="w-full rounded-2xl border border-fuchsia-100 bg-white px-4 py-3 outline-none"
                />
              </label>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(item.totalPrice))}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              disabled={loadingId === item.id}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4">
        <p className="text-sm text-slate-500">Total do carrinho</p>
        <p className="text-xl font-bold text-slate-900">{formatCurrency(total)}</p>
      </div>
      {message ? <p className="mt-4 text-sm font-medium text-rose-600">{message}</p> : null}
    </div>
  );
}
