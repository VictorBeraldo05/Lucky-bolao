import Link from "next/link";
import { ShieldCheck, Sparkles, Target, WalletCards } from "lucide-react";
import { MobilePoolsList } from "@/components/mobile/mobile-pools-list";
import { ReferralPromoBanner } from "@/components/referral-promo-banner";
import type { MobilePoolRow } from "@/components/mobile/mobile-pool-card";

type MobileHomeProps = {
  pools: MobilePoolRow[];
  isAuthenticated: boolean;
  inviteCode?: string | null;
};

const quickCards = [
  { title: "Cotas a partir de R$ 2,50", icon: WalletCards },
  { title: "Compra 100% online", icon: ShieldCheck },
  { title: "Resultados conferidos", icon: Target },
  { title: "Bolões organizados", icon: Sparkles },
];

export function MobileHome({ pools, isAuthenticated, inviteCode }: MobileHomeProps) {
  return (
    <div className="space-y-5 px-4 py-4 md:hidden">
      <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_14px_40px_rgba(188,131,230,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">Lotofácil online</p>
        <h1 className="mt-3 text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900">
          Compre cotas e acompanhe seus bolões sem complicação.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Entre nos próximos concursos com poucos toques e acompanhe tudo na sua conta.
        </p>
        <Link
          href="/loterias/lotofacil/boloes"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white"
        >
          Ver bolões disponíveis
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {quickCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-600">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold leading-5 text-slate-900">{card.title}</p>
            </article>
          );
        })}
      </section>

      <ReferralPromoBanner inviteCode={inviteCode ?? null} />

      <MobilePoolsList
        pools={pools}
        isAuthenticated={isAuthenticated}
        title="Bolões disponíveis"
        eyebrow="Comprar agora"
        actionHref="/loterias/lotofacil/boloes"
        actionLabel="Ver todos"
      />
    </div>
  );
}
