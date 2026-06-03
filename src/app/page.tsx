import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Container } from "@/components/container";
import { PoolTable } from "@/components/pool-table";
import { SectionHeading } from "@/components/section-heading";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [session, lottery, featuredPools] = await Promise.all([
    getSession(),
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
    <div className="pb-12 sm:pb-16">
      <Container className="py-4 sm:py-8">
        <div className="rounded-[28px] border border-white/80 bg-white/90 px-4 py-4 shadow-[0_18px_60px_rgba(188,131,230,0.12)] sm:rounded-[32px] sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-500 sm:text-sm">
                Lotofácil online
              </p>
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
            <span className="rounded-full bg-sky-50 px-4 py-2 font-medium text-sky-700">
              Próximo concurso: #{lottery?.contests[0]?.contestNumber ?? "--"}
            </span>
          </div>
        </div>

        <Link
          href="/cadastro"
          className="mt-3 block overflow-hidden rounded-[28px] border border-fuchsia-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(181,255,69,0.22),_transparent_28%),linear-gradient(135deg,_#220046_0%,_#4c1394_50%,_#220046_100%)] p-4 text-white shadow-[0_16px_44px_rgba(78,17,129,0.25)] sm:hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-950">
                Promoção especial
              </span>
              <h2 className="mt-3 text-xl font-black leading-tight">
                Convide um amigo e ganhe <span className="text-lime-300">R$ 5,00</span>
              </h2>
              <p className="mt-2 max-w-[18rem] text-sm leading-5 text-white/85">
                Seu amigo faz a primeira compra e você ganha crédito para tentar a sorte.
              </p>
            </div>

            <div className="shrink-0 rounded-[22px] bg-white/10 p-2 backdrop-blur-sm">
              <Image src="/lucky-clover.svg" alt="Lucky Bolões" width={56} height={56} className="h-14 w-14" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[22px] border border-white/12 bg-white/10 px-3 py-2 backdrop-blur-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Você ganha</p>
              <p className="text-lg font-black text-lime-300">R$ 5,00 de crédito</p>
            </div>
            <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-fuchsia-700">
              Convidar agora
            </span>
          </div>
        </Link>
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

        <PoolTable pools={featuredPools} isAuthenticated={Boolean(session?.sub)} />
      </Container>
    </div>
  );
}
