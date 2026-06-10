import { MobilePoolsList } from "@/components/mobile/mobile-pools-list";
import type { MobilePoolRow } from "@/components/mobile/mobile-pool-card";
import { ReferralPromoBanner } from "@/components/referral-promo-banner";

type MobileHomeProps = {
  pools: MobilePoolRow[];
  isAuthenticated: boolean;
  inviteCode?: string | null;
};

export function MobileHome({ pools, isAuthenticated, inviteCode }: MobileHomeProps) {
  return (
    <div className="space-y-5 px-4 py-4 md:hidden">
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
