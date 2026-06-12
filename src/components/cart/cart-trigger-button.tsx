"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type CartApiItem = {
  quantity: number;
};

type CartUpdateDetail = {
  addedItem?: {
    quantity: number;
  };
};

export function CartTriggerButton() {
  const router = useRouter();
  const [items, setItems] = useState<CartApiItem[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  async function loadCart() {
    try {
      const response = await fetch("/api/cart/items", { cache: "no-store" });
      if (!response.ok) {
        setItems([]);
        return;
      }

      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCart();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function triggerAnimation() {
      setIsAnimating(true);
      window.setTimeout(() => {
        setIsAnimating(false);
      }, 700);
    }

    function handleUpdated(event: Event) {
      const detail = (event as CustomEvent<CartUpdateDetail>).detail;
      void loadCart();

      if (detail?.addedItem) {
        triggerAnimation();
      }
    }

    function handleApproved() {
      setItems([]);
      setIsAnimating(false);
    }

    window.addEventListener("cart:updated", handleUpdated as EventListener);
    window.addEventListener("cart:approved", handleApproved);

    return () => {
      window.removeEventListener("cart:updated", handleUpdated as EventListener);
      window.removeEventListener("cart:approved", handleApproved);
    };
  }, []);

  function handleClick() {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      window.dispatchEvent(new CustomEvent("cart:open"));
      return;
    }

    router.push("/carrinho");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm transition hover:border-fuchsia-200",
        isAnimating && "scale-110 border-fuchsia-300 text-fuchsia-700 shadow-[0_0_0_6px_rgba(217,70,239,0.12)]",
      )}
      aria-label="Abrir carrinho"
    >
      <ShoppingCart className={cn("h-5 w-5 transition-transform duration-300", isAnimating && "animate-bounce")} />
      {itemCount > 0 ? (
        <span
          className={cn(
            "absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-bold text-white shadow-sm transition-transform duration-300",
            isAnimating && "scale-125",
          )}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}
