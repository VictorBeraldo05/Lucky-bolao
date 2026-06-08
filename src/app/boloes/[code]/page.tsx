import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { NumberGrid } from "@/components/number-grid";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { StatusBadge } from "@/components/status-badge";
import { applyTemporaryPoolUrgencyMask } from "@/lib/temporary-pool-urgency";
import { formatCurrency, formatDate, getPoolCommercialSummary } from "@/lib/utils";

export default async function PoolDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const pool = await prisma.pool.findUnique({
    where: { code },
    include: {
      contest: true,
      lottery: true,
      gameType: true,
      games: true,
      shares: true,
    },
  });

  if (!pool) notFound();

  const displayPool = applyTemporaryPoolUrgencyMask(pool);

  const summary = getPoolCommercialSummary({
    relativeChance: displayPool.relativeChance,
    description: displayPool.description,
    totalShares: displayPool.totalShares,
    sharePrice: displayPool.sharePrice,
    gamesCount: displayPool.games.length,
  });

  return (
    <Container className="py-10">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{displayPool.lottery.name}</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{displayPool.title}</h1>
                <p className="mt-3 text-slate-600">{displayPool.description}</p>
                <p className="mt-3 text-sm font-medium text-fuchsia-700">
                  Veja as dezenas, confirme suas cotas e acompanhe tudo pela sua conta.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                    {summary.gamesLabel}
                  </span>
                  {summary.equivalentLabel ? (
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {summary.equivalentLabel}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    {summary.sharesLabel}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {summary.sharePriceLabel}
                  </span>
                </div>
              </div>
              <StatusBadge status={displayPool.status} />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Código:</span> {displayPool.code}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Tipo:</span> {displayPool.gameType.name}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Concurso:</span> {displayPool.contest.contestNumber}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Sorteio:</span> {formatDate(displayPool.contest.drawDate)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Valor total:</span> {formatCurrency(displayPool.totalValue)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Por cota:</span> {formatCurrency(displayPool.sharePrice)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Cotas:</span> {displayPool.availableShares}/{displayPool.totalShares} disponíveis
              </p>
              <p>
                <span className="font-semibold text-slate-900">Chance:</span> {displayPool.relativeChance ?? "Ampliada"}
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Jogos do bolão</h2>
            <div className="mt-5 space-y-5">
              {displayPool.games.map((game) => (
                <div key={game.id} className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{game.title}</p>
                    {game.hits != null ? <p className="text-sm font-semibold text-fuchsia-700">{game.hits} acertos</p> : null}
                  </div>
                  <NumberGrid numbers={game.numbers} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <PurchaseForm
            poolId={displayPool.id}
            poolTitle={displayPool.title}
            poolCode={displayPool.code}
            sharePrice={Number(displayPool.sharePrice)}
            availableShares={displayPool.availableShares}
          />
        </aside>
      </div>
    </Container>
  );
}
