import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { PoolCard } from "@/components/pool-card";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";

export default async function Home() {
  const [lottery, featuredPools, totals] = await Promise.all([
    prisma.lottery.findUnique({
      where: { slug: "lotofacil" },
      include: { contests: { take: 2, orderBy: { drawDate: "asc" } } },
    }),
    prisma.pool.findMany({
      where: { status: "OPEN" },
      include: {
        lottery: true,
        gameType: true,
        contest: true,
        games: true,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    prisma.$transaction([
      prisma.user.count(),
      prisma.pool.count(),
      prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
    ]),
  ]);

  return (
    <div className="pb-16">
      <Container className="py-10 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-fuchsia-200 bg-white/80 px-4 py-2 text-sm font-semibold text-fuchsia-600 shadow-sm">
              Seus bolões, saldo e comprovantes em um só lugar
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
                Entre em bolões online com mais confiança e acompanhe tudo sem complicação.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Escolha suas cotas, acompanhe concursos, confira comprovantes e consulte cada movimentação da sua conta sempre que quiser.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/loterias/lotofacil/boloes"
                className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white shadow-lg shadow-fuchsia-200 hover:bg-fuchsia-700"
              >
                Quero participar
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 bg-white px-6 py-3 font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
              >
                Criar conta grátis
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm">Compra de cotas com saldo em conta</span>
              <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm">Comprovantes vinculados a cada bolão</span>
              <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm">Histórico claro de jogos e movimentações</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Usuarios" value={String(totals[0])} helper="Contas ativas acompanhando seus jogos." />
              <StatCard label="Boloes" value={String(totals[1])} helper="Opcoes disponiveis para entrar online." />
              <StatCard
                label="Vendido"
                value={`R$ ${Number(totals[2]._sum.totalAmount ?? 0).toFixed(2)}`}
                helper="Compras registradas com transparencia."
              />
            </div>
          </div>

          <div className="rounded-[36px] border border-white/80 bg-white/85 p-6 shadow-[0_25px_90px_rgba(187,131,228,0.22)]">
            <div className="rounded-[28px] bg-linear-to-br from-fuchsia-600 via-violet-500 to-pink-500 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-100">Loteria em destaque</p>
              <h2 className="mt-3 text-3xl font-bold">{lottery?.name}</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-fuchsia-50">{lottery?.description}</p>
            </div>
            <div className="mt-5 grid gap-4">
              {lottery?.contests.map((contest) => (
                <div key={contest.id} className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-5">
                  <p className="text-sm font-semibold text-fuchsia-500">Próximo sorteio</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">#{contest.contestNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(contest.drawDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <Container className="space-y-8">
        <SectionHeading
          eyebrow="Em destaque"
          title="Bolões em destaque"
          description="Compare valores, veja as dezenas escolhidas e entre com mais segurança no bolão ideal para o próximo concurso."
          action={
            <Link href="/loterias/lotofacil/boloes" className="text-sm font-semibold text-fuchsia-600">
              Ver todos os bolões
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {featuredPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      </Container>
    </div>
  );
}
