import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { PoolCard } from "@/components/pool-card";
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
      <SectionHeading eyebrow="Bolões" title="Listagem da Lotofacil" description="Fluxo de compra já estruturado com controle de saldo, disponibilidade de cotas, histórico, comprovante interno e auditoria." />
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {pools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} />
        ))}
      </div>
    </Container>
  );
}

