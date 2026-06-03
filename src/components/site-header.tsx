import Image from "next/image";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { Notification, UserRole, Wallet } from "@prisma/client";
import { Container } from "@/components/container";
import { CartTriggerButton } from "@/components/cart/cart-trigger-button";
import { LogoutButton } from "@/components/logout-button";
import { NotificationsButton } from "@/components/notifications-button";
import { formatCurrency, getWalletAvailableBalance } from "@/lib/utils";

type SiteHeaderProps = {
  user:
    | {
        id: string;
        inviteCode: string;
        name: string;
        email: string;
        role: UserRole;
        wallet: Wallet | null;
        notifications: Pick<Notification, "id" | "title" | "message" | "createdAt">[];
      }
    | null;
};

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/loterias", label: "Loterias" },
  { href: "/loterias/lotofacil/boloes", label: "Bolões" },
  { href: "/resultados", label: "Resultados" },
  { href: "/como-funciona", label: "Como funciona" },
];

export async function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <Container className="flex min-h-18 items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111707] shadow-lg shadow-lime-200/60 ring-1 ring-lime-300/40">
              <Image
                src="/lucky-clover.svg"
                alt="Lucky Bolões"
                width={44}
                height={44}
                className="h-11 w-11"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-900 sm:text-base">Lucky Bolões</p>
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">Bolões online</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-fuchsia-600">
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link href="/meus-jogos" className="text-sm font-medium text-slate-600 transition hover:text-fuchsia-600">
                Meus jogos
              </Link>
            ) : null}
            {user?.role === "ADMIN" ? (
              <Link href="/admin" className="text-sm font-medium text-slate-600 transition hover:text-fuchsia-600">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user?.wallet ? (
            <div className="hidden rounded-full border border-fuchsia-100 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-700 sm:block">
              Saldo: {formatCurrency(getWalletAvailableBalance(user.wallet))}
            </div>
          ) : null}

          <CartTriggerButton />
          <NotificationsButton
            notifications={(user?.notifications ?? []).map((notification) => ({
              ...notification,
              createdAt: notification.createdAt.toISOString(),
            }))}
          />

          {user ? (
            <>
              <Link href="/perfil" className="flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-2 shadow-sm transition hover:border-fuchsia-200">
                <UserCircle2 className="h-5 w-5 text-fuchsia-600" />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.role === "ADMIN" ? "Administrador" : "Cliente"}</p>
                </div>
              </Link>
              <LogoutButton className="hidden rounded-full border border-fuchsia-200 bg-white px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 sm:inline-flex disabled:opacity-60" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full border border-fuchsia-200 px-3 py-2 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 sm:px-4 sm:text-sm">
                Entrar
              </Link>
              <Link href="/cadastro" className="rounded-full bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-700 sm:px-4 sm:text-sm">
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
