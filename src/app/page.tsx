import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { SectionHeading } from "@/components/section-heading";

export default async function Home() {
  const [lottery, featuredPools] = await Promise.all([
    prisma.lottery.findUnique({
      where: { slug: "lotofacil" },
      include: { contests: { take: 1, orderBy: { drawDate: "asc" } } },
    }),
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

  return (
    <div className="pb-16">
      <Container className="py-6 sm:py-8">
        <div className="rounded-[32px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_18px_60px_rgba(188,131,230,0.12)] sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Lotofácil online</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Escolha seu bolão, compre suas cotas e acompanhe tudo na sua conta.
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                As melhores opções estão logo abaixo. Compare valores, dezenas e quantidade de cotas e entre no próximo concurso em poucos cliques.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/loterias/lotofacil/boloes"
                className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-200 hover:bg-fuchsia-700"
              >
                Ver todos os bolões
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 bg-white px-6 py-3 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
              >
                Criar conta
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-fuchsia-50 px-4 py-2 font-medium text-fuchsia-700">Compra rápida por cota</span>
            <span className="rounded-full bg-violet-50 px-4 py-2 font-medium text-violet-700">Comprovantes vinculados aos bolões</span>
            <span className="rounded-full bg-sky-50 px-4 py-2 font-medium text-sky-700">
              Próximo concurso: #{lottery?.contests[0]?.contestNumber ?? "--"}
            </span>
          </div>
        </div>
      </Container>

      <Container className="space-y-6">
        <SectionHeading
          eyebrow="Comprar agora"
          title="Bolões disponíveis"
          description="As opções mais acessíveis e mais procuradas ficam em destaque para você decidir rápido."
          action={
            <Link href="/loterias/lotofacil/boloes" className="text-sm font-semibold text-fuchsia-600">
              Abrir listagem completa
            </Link>
          }
        />

        <PoolTable pools={featuredPools} />
      </Container>
    </div>
  );
}
