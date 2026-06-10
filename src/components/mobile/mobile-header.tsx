import Image from "next/image";
import Link from "next/link";
import { Notification, UserRole, Wallet } from "@prisma/client";
import { UserCircle2 } from "lucide-react";
import { CartTriggerButton } from "@/components/cart/cart-trigger-button";
import { NotificationsButton } from "@/components/notifications-button";

type MobileHeaderProps = {
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

export function MobileHeader({ user }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/90 backdrop-blur-xl md:hidden">
      <div className="px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#111707] shadow-lg shadow-lime-200/60 ring-1 ring-lime-300/40">
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
              <p className="truncate text-lg font-black tracking-tight text-slate-900">Lucky Bolões</p>
              <p className="truncate text-xs text-slate-500">Bolões online</p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <CartTriggerButton />
            <NotificationsButton
              notifications={(user?.notifications ?? []).map((notification) => ({
                ...notification,
                createdAt: notification.createdAt.toISOString(),
              }))}
            />
            <Link
              href={user ? "/perfil" : "/login"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm transition hover:border-fuchsia-200"
              aria-label={user ? "Abrir conta" : "Entrar na conta"}
            >
              <UserCircle2 className="h-5 w-5 text-fuchsia-600" />
            </Link>
          </div>
        </div>

        {!user ? (
          <div className="mt-3 flex gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-fuchsia-200 px-4 py-2 text-sm font-semibold text-fuchsia-700"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Criar conta
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
