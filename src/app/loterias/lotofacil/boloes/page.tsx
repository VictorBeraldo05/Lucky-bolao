import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { SectionHeading } from "@/components/section-heading";

export default async function LotofacilPoolsPage() {
  const pools = await prisma.pool.findMany({
    where: {
      lottery: { slug: "lotofacil" },
    },
    include: {
      contest: true,
      lottery: true,
      gameType: true,
      games: true,
    },
    orderBy: [{ status: "asc" }, { contest: { drawDate: "asc" } }],
  });

  return (
    <Container className="py-10 space-y-8">
      <SectionHeading eyebrow="Bolões" title="Listagem da Lotofacil" description="Confira os bolões disponíveis, escolha suas cotas e acompanhe tudo pela sua conta." />
      <PoolTable pools={pools} />
    </Container>
  );
}
