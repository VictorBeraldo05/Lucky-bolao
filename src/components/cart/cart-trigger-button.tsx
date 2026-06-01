"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

export function CartTriggerButton() {
  const router = useRouter();

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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm transition hover:border-fuchsia-200"
    >
      <ShoppingCart className="h-5 w-5" />
    </button>
  );
}
