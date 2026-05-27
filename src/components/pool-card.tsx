import Link from "next/link";
import { LotteryGameType, Lottery, Pool, Contest, PoolGame } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
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
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-slate-900">Codigo:</span> {pool.code}
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
            <span className="font-semibold text-slate-900">Disponiveis:</span> {pool.availableShares}/{pool.totalShares}
          </div>
        </div>

        {pool.games[0] ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Primeiro jogo do bolao</p>
            <NumberGrid numbers={pool.games[0].numbers} size="sm" />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{pool.relativeChance ?? "Chance ampliada"}</p>
          <Link
            href={`/boloes/${pool.code}`}
            className="inline-flex items-center justify-center rounded-full bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
          >
            Ver bolao
          </Link>
        </div>
      </div>
    </article>
  );
}

