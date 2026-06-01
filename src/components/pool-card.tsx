import Link from "next/link";
import { LotteryGameType, Lottery, Pool, Contest, PoolGame } from "@prisma/client";
import { formatCurrency, formatDate, getPoolCommercialSummary } from "@/lib/utils";
import { NumberGrid } from "@/components/number-grid";
import { StatusBadge } from "@/components/status-badge";

type PoolCardProps = {
  pool: Pool & {
    lottery: Lottery;
    gameType: LotteryGameType;
    contest: Contest;
    games: PoolGame[];
  };
};

export function PoolCard({ pool }: PoolCardProps) {
  const summary = getPoolCommercialSummary({
    relativeChance: pool.relativeChance,
    description: pool.description,
    totalShares: pool.totalShares,
    sharePrice: pool.sharePrice,
    gamesCount: pool.games.length,
  });

  return (
    <article className="overflow-hidden rounded-[32px] border border-white/80 bg-white/90 shadow-[0_20px_70px_rgba(188,131,230,0.16)]">
      <div className="border-b border-fuchsia-100 bg-linear-to-r from-fuchsia-50 via-white to-violet-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{pool.lottery.name}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{pool.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{pool.description}</p>
          </div>
          <StatusBadge status={pool.status} />
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">{summary.gamesLabel}</span>
          {summary.equivalentLabel ? (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{summary.equivalentLabel}</span>
          ) : null}
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{summary.sharesLabel}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{summary.sharePriceLabel}</span>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-slate-900">Código:</span> {pool.code}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Concurso:</span> {pool.contest.contestNumber}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Sorteio:</span> {formatDate(pool.contest.drawDate)}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Tipo:</span> {pool.gameType.name}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Cota:</span> {formatCurrency(pool.sharePrice)}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Disponíveis:</span> {pool.availableShares}/{pool.totalShares}
          </div>
        </div>

        {pool.games[0] ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Primeiro jogo do bolão</p>
            <NumberGrid numbers={pool.games[0].numbers} size="sm" />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{pool.relativeChance ?? "Mais combinações para o próximo sorteio"}</p>
          <Link
            href={`/boloes/${pool.code}`}
            className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
