import { Contest, Lottery, LotteryGameType, Pool, PoolGame } from "@prisma/client";
import { NumberGrid } from "@/components/number-grid";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, getPoolCommercialSummary } from "@/lib/utils";

type MobilePoolDetailProps = {
  pool: Pool & {
    contest: Contest;
    lottery: Lottery;
    gameType: LotteryGameType;
    games: PoolGame[];
  };
};

export function MobilePoolDetail({ pool }: MobilePoolDetailProps) {
  const summary = getPoolCommercialSummary({
    relativeChance: pool.relativeChance,
    description: pool.description,
    totalShares: pool.totalShares,
    sharePrice: pool.sharePrice,
    gamesCount: pool.games.length,
  });

  const canBuy = pool.status === "OPEN" && pool.availableShares > 0;
  const purchaseFormId = `purchase-form-${pool.id}`;

  return (
    <div className="space-y-4 px-4 py-4 pb-36 md:hidden">
      <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">{pool.lottery.name}</p>
            <h1 className="mt-2 text-[1.9rem] font-black leading-[1.05] tracking-tight text-slate-900">{pool.title}</h1>
          </div>
          <StatusBadge status={pool.status} />
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{pool.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">
            {summary.gamesLabel}
          </span>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            {summary.equivalentLabel}
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            {pool.availableShares}/{pool.totalShares} cotas
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-500">Código</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{pool.code}</p>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-500">Concurso</p>
          <p className="mt-2 text-sm font-bold text-slate-900">#{pool.contest.contestNumber}</p>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-500">Sorteio</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(pool.contest.drawDate)}</p>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-500">Valor</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{formatCurrency(pool.sharePrice)}</p>
        </div>
      </section>

      <section id="comprar" className="scroll-mt-24">
        <PurchaseForm
          poolId={pool.id}
          poolTitle={pool.title}
          poolCode={pool.code}
          sharePrice={Number(pool.sharePrice)}
          availableShares={pool.availableShares}
          formId={purchaseFormId}
          hideSubmitButton
        />
      </section>

      <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Jogos do bolão</h2>
          <p className="text-sm font-semibold text-fuchsia-600">{pool.games.length} jogos</p>
        </div>
        <div className="mt-4 space-y-3">
          {pool.games.map((game) => (
            <div key={game.id} className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{game.title}</p>
                {game.hits != null ? (
                  <span className="text-xs font-semibold text-fuchsia-700">{game.hits} acertos</span>
                ) : null}
              </div>
              <NumberGrid numbers={game.numbers} size="sm" />
            </div>
          ))}
        </div>
      </section>

      {canBuy ? (
        <div className="fixed inset-x-0 z-[72] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden" style={{ bottom: "84px" }}>
          <button
            type="submit"
            form={purchaseFormId}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(192,38,211,0.28)]"
          >
            Adicionar ao carrinho
          </button>
        </div>
      ) : null}
    </div>
  );
}
