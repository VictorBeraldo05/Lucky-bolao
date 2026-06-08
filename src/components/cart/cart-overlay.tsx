"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, ShoppingCart, Sparkles, X } from "lucide-react";
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
    availableShares: number;
  };
};

type CartOverlayProps = {
  userCpf?: string | null;
  isAuthenticated: boolean;
};

type CartUpdateDetail = {
  openDesktopDrawer?: boolean;
  addedItem?: {
    title: string;
    code: string;
    quantity: number;
    total: number;
    href: string;
  };
};

export function CartOverlay({ userCpf, isAuthenticated }: CartOverlayProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [quickAddLoadingId, setQuickAddLoadingId] = useState<string | null>(null);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<CartUpdateDetail["addedItem"] | null>(null);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const shouldHideMobileBar = pathname === "/carrinho" || pathname.startsWith("/carrinho/");

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

  const closeDrawer = useCallback(() => {
    setIsDrawerVisible(false);
    window.setTimeout(() => {
      setIsDrawerOpen(false);
    }, 220);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerVisible(false);
    setIsDrawerOpen(true);
    window.setTimeout(() => {
      setIsDrawerVisible(true);
    }, 10);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCart();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCart]);

  useEffect(() => {
    if (!recentlyAdded) return;

    const timeoutId = window.setTimeout(() => {
      setRecentlyAdded(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyAdded]);

  useEffect(() => {
    function handleOpen() {
      openDrawer();
      void loadCart();
    }

    function handleUpdated(event: Event) {
      const detail = (event as CustomEvent<CartUpdateDetail>).detail;
      void loadCart();

      if (detail?.addedItem) {
        setRecentlyAdded(detail.addedItem);
      }

      if (typeof window !== "undefined" && window.innerWidth >= 1024 && detail?.openDesktopDrawer) {
        openDrawer();
      }
    }

    function handleApproved() {
      setItems([]);
      setTotal(0);
      setRecentlyAdded(null);
      setQuickAddMessage(null);
      closeDrawer();
    }

    window.addEventListener("cart:open", handleOpen);
    window.addEventListener("cart:updated", handleUpdated as EventListener);
    window.addEventListener("cart:approved", handleApproved);

    return () => {
      window.removeEventListener("cart:open", handleOpen);
      window.removeEventListener("cart:updated", handleUpdated as EventListener);
      window.removeEventListener("cart:approved", handleApproved);
    };
  }, [closeDrawer, loadCart, openDrawer]);

  async function removeItem(itemId: string) {
    await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    await loadCart();
  }

  async function addMoreOfSamePool(item: CartItem, quantity: number) {
    setQuickAddLoadingId(item.id);
    setQuickAddMessage(null);

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: item.pool.id, quantity }),
      });
      const data = await response.json();

      if (!response.ok) {
        setQuickAddMessage(data.message ?? "Não foi possível adicionar mais cotas agora.");
        return;
      }

      setRecentlyAdded({
        title: item.pool.title,
        code: item.pool.code,
        quantity,
        total: Number(item.unitPrice) * quantity,
        href: `/boloes/${item.pool.code}`,
      });
      setQuickAddMessage(`Mais ${quantity} cota(s) adicionada(s) ao carrinho.`);
      await loadCart();
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      setQuickAddMessage("Erro de rede ao tentar adicionar mais cotas.");
    } finally {
      setQuickAddLoadingId(null);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isDrawerOpen ? (
        <div
          className={`fixed inset-0 z-[72] hidden bg-slate-950/45 backdrop-blur-sm transition-opacity duration-200 lg:block ${
            isDrawerVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeDrawer}
        >
          <aside
            className={`ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/80 bg-white/95 shadow-2xl transition-transform duration-300 ${
              isDrawerVisible ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-fuchsia-100 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">Seu carrinho</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Finalize sua compra por aqui</h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {recentlyAdded ? (
                <div className="mb-5 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-700">Cotas adicionadas ao carrinho</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {recentlyAdded.quantity} cota(s) de {recentlyAdded.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">Total incluído agora: {formatCurrency(recentlyAdded.total)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

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
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Adicionar mais</span>
                        <button
                          type="button"
                          onClick={() => void addMoreOfSamePool(item, 1)}
                          disabled={quickAddLoadingId === item.id || item.pool.availableShares - item.quantity < 1}
                          className="rounded-full border border-fuchsia-200 bg-white px-3 py-1.5 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          +1 cota
                        </button>
                        <button
                          type="button"
                          onClick={() => void addMoreOfSamePool(item, 2)}
                          disabled={quickAddLoadingId === item.id || item.pool.availableShares - item.quantity < 2}
                          className="rounded-full border border-fuchsia-200 bg-white px-3 py-1.5 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          +2 cotas
                        </button>
                        <span className="text-xs text-slate-500">
                          Restantes para este bolão: {Math.max(item.pool.availableShares - item.quantity, 0)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-fuchsia-200 bg-white p-6 text-sm text-slate-500">
                    Seu carrinho está vazio no momento.
                  </div>
                )}
              </div>

              {items.length ? (
                <div className="mt-6 rounded-[28px] border border-fuchsia-100 bg-linear-to-br from-fuchsia-50 via-white to-violet-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-600/10 text-fuchsia-600">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-fuchsia-500">Continue comprando</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">Quer aumentar suas chances neste concurso?</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Seu carrinho já tem {itemCount} cota(s). Você pode incluir mais opções antes de finalizar o PIX.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const targetHref = recentlyAdded?.href ?? "/loterias/lotofacil/boloes";
                            closeDrawer();
                            window.location.href = targetHref;
                          }}
                          className="rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                        >
                          Adicionar mais cotas
                        </button>
                        <Link
                          href="/loterias/lotofacil/boloes"
                          onClick={closeDrawer}
                          className="rounded-full border border-fuchsia-200 px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
                        >
                          Ver mais bolões
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {quickAddMessage ? <p className="mt-4 text-sm font-medium text-fuchsia-700">{quickAddMessage}</p> : null}

              <div className="mt-6">
                <CartCheckoutPanel
                  total={total}
                  userCpf={userCpf}
                  onApproved={() => {
                    setItems([]);
                    setTotal(0);
                    setRecentlyAdded(null);
                    setQuickAddMessage(null);
                    closeDrawer();
                  }}
                />
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {items.length > 0 && !shouldHideMobileBar ? (
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
            onClick={openDrawer}
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
