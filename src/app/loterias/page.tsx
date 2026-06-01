import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { SectionHeading } from "@/components/section-heading";

export default async function LoteriasPage() {
  const lotteries = await prisma.lottery.findMany({
    include: {
      gameTypes: true,
      contests: { take: 1, orderBy: { drawDate: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <Container className="space-y-8 py-10">
      <SectionHeading eyebrow="Loterias" title="Escolha sua modalidade" description="Encontre a loteria ideal para você e acompanhe os bolões disponíveis em cada concurso." />
      <div className="grid gap-6 lg:grid-cols-2">
        {lotteries.map((lottery) => (
          <article key={lottery.id} className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{lottery.name}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{lottery.description}</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p><span className="font-semibold text-slate-900">Faixa:</span> {lottery.numberStart} a {lottery.numberEnd}</p>
              <p><span className="font-semibold text-slate-900">Aposta:</span> {lottery.minNumbers} a {lottery.maxNumbers} dezenas</p>
              <p><span className="font-semibold text-slate-900">Tipos:</span> {lottery.gameTypes.length}</p>
              <p><span className="font-semibold text-slate-900">Sorteios:</span> {lottery.drawDays.join(", ")}</p>
            </div>
            <Link href={lottery.slug === "lotofacil" ? "/loterias/lotofacil" : "/"} className="mt-5 inline-flex rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white">
              Ver bolões
            </Link>
          </article>
        ))}
      </div>
    </Container>
  );
}
