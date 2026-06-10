"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Home, ShoppingCart, Ticket, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  isAuthenticated: boolean;
};

const hiddenPrefixes = ["/admin"];
const hiddenPaths = ["/login", "/cadastro"];

export function MobileBottomNav({ isAuthenticated }: MobileBottomNavProps) {
  const pathname = usePathname();

  if (!pathname) return null;
  if (hiddenPaths.includes(pathname) || hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const items = [
    { href: "/", label: "Início", icon: Home, active: pathname === "/" },
    {
      href: "/loterias/lotofacil/boloes",
      label: "Bolões",
      icon: Ticket,
      active: pathname.startsWith("/loterias") || pathname.startsWith("/boloes/"),
    },
    {
      href: isAuthenticated ? "/meus-jogos" : "/login",
      label: "Meus jogos",
      icon: Gamepad2,
      active: pathname.startsWith("/meus-jogos"),
    },
    {
      href: isAuthenticated ? "/carrinho" : "/login",
      label: "Carrinho",
      icon: ShoppingCart,
      active: pathname.startsWith("/carrinho"),
    },
    {
      href: isAuthenticated ? "/minha-conta" : "/login",
      label: "Conta",
      icon: User2,
      active:
        pathname.startsWith("/minha-conta") ||
        pathname.startsWith("/perfil") ||
        pathname.startsWith("/carteira") ||
        pathname.startsWith("/extrato") ||
        pathname.startsWith("/notificacoes") ||
        pathname.startsWith("/comprovantes") ||
        pathname.startsWith("/resgates"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[74] border-t border-fuchsia-100 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold text-slate-500 transition",
                item.active && "bg-fuchsia-50 text-fuchsia-700",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
