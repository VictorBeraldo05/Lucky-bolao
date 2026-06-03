import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activePoolStatuses } from "@/lib/status";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { SectionHeading } from "@/components/section-heading";

export default async function LotofacilPoolsPage() {
  const [session, pools] = await Promise.all([
    getSession(),
    prisma.pool.findMany({
      where: {
        lottery: { slug: "lotofacil" },
        status: { in: activePoolStatuses },
      },
      include: {
        contest: true,
        lottery: true,
        gameType: true,
        games: true,
      },
      orderBy: [{ status: "asc" }, { contest: { drawDate: "asc" } }],
    }),
  ]);

  return (
    <Container className="space-y-8 py-10">
      <SectionHeading eyebrow="Bolões" title="Listagem da Lotofácil" description="Confira os bolões disponíveis, escolha suas cotas e acompanhe tudo pela sua conta." />
      <PoolTable pools={pools} isAuthenticated={Boolean(session?.sub)} />
    </Container>
  );
}
