import Link from "next/link";
import { Bell, CreditCard, ShoppingCart, UserCircle2 } from "lucide-react";
import { Notification, UserRole, Wallet } from "@prisma/client";
import { Container } from "@/components/container";
import { formatCurrency } from "@/lib/utils";

type SiteHeaderProps = {
  user:
    | {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        wallet: Wallet | null;
        notifications: Pick<Notification, "id">[];
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
      <Container className="flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-600 to-violet-500 text-lg font-black text-white shadow-lg shadow-fuchsia-200">
              LB
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-slate-900">Lucky Bolões</p>
              <p className="text-xs text-slate-500">Bolões online</p>
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

        <div className="flex items-center gap-2 sm:gap-3">
          {user?.wallet ? (
            <div className="hidden rounded-full border border-fuchsia-100 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-700 sm:block">
              Saldo: {formatCurrency(user.wallet.balance)}
            </div>
          ) : null}

          <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm">
            <ShoppingCart className="h-5 w-5" />
          </button>
          <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm">
            <Bell className="h-5 w-5" />
            {user?.notifications.length ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-fuchsia-500" /> : null}
          </button>

          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-2 shadow-sm">
              <UserCircle2 className="h-5 w-5 text-fuchsia-600" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role === "ADMIN" ? "Administrador" : "Cliente"}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full border border-fuchsia-200 px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50">
                Entrar
              </Link>
              <Link href="/cadastro" className="rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700">
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </Container>
      {user ? (
        <Container className="flex gap-2 overflow-x-auto py-3 lg:hidden">
          <Link href="/meus-jogos" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            Meus jogos
          </Link>
          <Link href="/carteira" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4" /> Carteira</span>
          </Link>
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              Admin
            </Link>
          ) : null}
        </Container>
      ) : null}
    </header>
  );
}
