import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { ReferralPromoBanner } from "@/components/referral-promo-banner";
import { SectionHeading } from "@/components/section-heading";
import { prisma } from "@/lib/prisma";
import { applyTemporaryPoolUrgencyMask } from "@/lib/temporary-pool-urgency";

export default async function Home() {
  const [session, featuredPools] = await Promise.all([
    getSession(),
    prisma.pool.findMany({
      where: { status: "OPEN" },
      include: {
        lottery: true,
        gameType: true,
        contest: true,
        games: true,
      },
      take: 4,
      orderBy: [{ sharePrice: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const inviteUser = session?.sub
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: { inviteCode: true },
      })
    : null;
  const displayPools = featuredPools.map(applyTemporaryPoolUrgencyMask);

  return (
    <div className="pb-12 sm:pb-16">
      <Container className="pt-1 pb-4 sm:py-8">
        <ReferralPromoBanner inviteCode={inviteUser?.inviteCode ?? null} />
      </Container>

      <Container className="space-y-6">
        <SectionHeading
          eyebrow="Comprar agora"
          title="Bolões disponíveis"
          action={
            <Link href="/loterias/lotofacil/boloes" className="text-sm font-semibold text-fuchsia-600">
              Abrir listagem completa
            </Link>
          }
        />

        <PoolTable pools={displayPools} isAuthenticated={Boolean(session?.sub)} />
      </Container>
    </div>
  );
}
