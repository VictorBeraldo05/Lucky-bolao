"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, ShoppingCart, X } from "lucide-react";
import { CartCheckoutPanel } from "@/components/cart/cart-checkout-panel";
import { formatCurrency } from "@/lib/utils";

type CartItem = {
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

type CartOverlayProps = {
  userCpf?: string | null;
  isAuthenticated: boolean;
};

export function CartOverlay({ userCpf, isAuthenticated }: CartOverlayProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/cart/items", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) return;
      setItems(data.items ?? []);
      setTotal(Number(data.total ?? 0));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCart();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCart]);

  useEffect(() => {
    function handleOpen() {
      setIsDrawerOpen(true);
      void loadCart();
    }

    function handleUpdated(event: Event) {
      const detail = (event as CustomEvent<{ openDesktopDrawer?: boolean }>).detail;
      void loadCart();
      if (typeof window !== "undefined" && window.innerWidth >= 1024 && detail?.openDesktopDrawer) {
        setIsDrawerOpen(true);
      }
    }

    window.addEventListener("cart:open", handleOpen);
    window.addEventListener("cart:updated", handleUpdated as EventListener);

    return () => {
      window.removeEventListener("cart:open", handleOpen);
      window.removeEventListener("cart:updated", handleUpdated as EventListener);
    };
  }, [loadCart]);

  async function removeItem(itemId: string) {
    await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    await loadCart();
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-[72] hidden bg-slate-950/45 backdrop-blur-sm lg:block" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/80 bg-white/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-fuchsia-100 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Seu carrinho</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Finalize sua compra por aqui</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-5 text-sm text-slate-500">Atualizando carrinho...</div>
                ) : items.length ? (
                  items.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.pool.title}</p>
                          <p className="mt-1 text-sm text-slate-500">Bolão {item.pool.code}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeItem(item.id)}
                          className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                        >
                          Remover
                        </button>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <span>{item.quantity} cota(s)</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-fuchsia-200 bg-white p-6 text-sm text-slate-500">
                    Seu carrinho está vazio no momento.
                  </div>
                )}
              </div>

              <div className="mt-6">
                <CartCheckoutPanel total={total} userCpf={userCpf} onApproved={() => void loadCart()} />
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-[71] border-t border-fuchsia-100 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] lg:hidden">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/carrinho";
            }}
            className="flex w-full items-center justify-between gap-4 rounded-full bg-fuchsia-600 px-4 py-3 text-left text-white"
          >
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{itemCount} item(ns) no carrinho</span>
                <span className="block text-xs text-white/80">Toque para abrir e finalizar</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              {formatCurrency(total)}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      ) : null}

      {items.length > 0 && !isDrawerOpen ? (
        <div className="fixed bottom-6 right-6 z-[71] hidden lg:block">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-3 rounded-full bg-fuchsia-600 px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(192,38,211,0.28)] transition hover:bg-fuchsia-700"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{itemCount} item(ns)</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{formatCurrency(total)}</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
