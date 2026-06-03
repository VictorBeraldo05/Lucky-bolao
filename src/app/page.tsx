import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { SectionHeading } from "@/components/section-heading";
import { prisma } from "@/lib/prisma";

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

  return (
    <div className="pb-12 sm:pb-16">
      <Container className="pt-1 pb-4 sm:py-8">
        <Link
          href="/cadastro"
          className="block overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_16px_40px_rgba(120,58,166,0.16)] sm:hidden"
        >
          <Image
            src="/promo-indique-ganhe.png"
            alt="Promoção especial: convide um amigo e ganhe R$ 5,00 de crédito"
            width={1790}
            height={888}
            className="h-auto w-full"
            priority
          />
        </Link>

        <div className="mt-3 hidden rounded-[28px] border border-white/80 bg-white/90 px-4 py-4 shadow-[0_18px_60px_rgba(188,131,230,0.12)] sm:mt-0 sm:block sm:rounded-[32px] sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-500 sm:text-sm">Lotofácil online</p>
              <h1 className="mt-1 text-[1.65rem] font-black leading-[1.08] tracking-tight text-slate-950 sm:mt-2 sm:text-4xl">
                Escolha seu bolão, acompanhe tudo na sua conta.
              </h1>
              <p className="mt-2 hidden text-sm leading-6 text-slate-600 sm:block sm:text-base">
                As melhores opções estão logo abaixo. Compare valores, dezenas e quantidade de cotas e entre no
                próximo concurso em poucos cliques.
              </p>
            </div>

            <div className="hidden flex-col gap-3 sm:flex sm:flex-row">
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

          <div className="mt-4 hidden flex-wrap gap-2 text-sm text-slate-500 sm:flex">
            <span className="rounded-full bg-fuchsia-50 px-4 py-2 font-medium text-fuchsia-700">Compra rápida por cota</span>
            <span className="rounded-full bg-violet-50 px-4 py-2 font-medium text-violet-700">
              Comprovantes vinculados aos bolões
            </span>
          </div>
        </div>
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

        <PoolTable pools={featuredPools} isAuthenticated={Boolean(session?.sub)} />
      </Container>
    </div>
  );
}
