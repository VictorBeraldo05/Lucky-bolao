import Link from "next/link";
import { Contest, Lottery, LotteryGameType, Pool, PoolGame } from "@prisma/client";
import { formatCurrency, formatDate, getPoolCommercialSummary } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type PoolTableProps = {
  pools: Array<
    Pool & {
      lottery: Lottery;
      gameType: LotteryGameType;
      contest: Contest;
      games: PoolGame[];
    }
  >;
};

export function PoolTable({ pools }: PoolTableProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white/95 shadow-[0_20px_70px_rgba(188,131,230,0.12)]">
      <div className="hidden grid-cols-[1.4fr_1.1fr_0.9fr_1fr_0.9fr_0.8fr_0.9fr] gap-4 border-b border-fuchsia-100 bg-linear-to-r from-fuchsia-50 via-white to-violet-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
        <div>Bolão</div>
        <div>Chances</div>
        <div>Valor</div>
        <div>Divisão de cotas</div>
        <div>Opções de jogos</div>
        <div>Ver números</div>
        <div>Comprar</div>
      </div>

      <div className="divide-y divide-fuchsia-50">
        {pools.map((pool) => {
          const summary = getPoolCommercialSummary({
            relativeChance: pool.relativeChance,
            description: pool.description,
            totalShares: pool.totalShares,
            sharePrice: pool.sharePrice,
            gamesCount: pool.games.length,
          });

          return (
            <div key={pool.id} className="px-5 py-5 lg:px-6">
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1.1fr_0.9fr_1fr_0.9fr_0.8fr_0.9fr] lg:items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-fuchsia-700">{pool.code}</p>
                    <StatusBadge status={pool.status} />
                  </div>
                  <p className="text-base font-semibold text-slate-900">{pool.title}</p>
                  <p className="text-sm text-slate-600">{pool.description}</p>
                  <p className="text-xs text-slate-500">
                    Concurso #{pool.contest.contestNumber} • {formatDate(pool.contest.drawDate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">{summary.gamesLabel}</p>
                  <p className="text-sm text-slate-600">{summary.equivalentLabel ?? pool.relativeChance ?? "Cobertura ampliada"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl font-black text-fuchsia-700">{formatCurrency(pool.sharePrice)}</p>
                  <p className="text-sm text-slate-500">por cota</p>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">
                    {pool.availableShares}/{pool.totalShares}
                  </p>
                  <p className="text-sm text-slate-500">cotas disponíveis</p>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">{pool.games.length.toString().padStart(2, "0")}</p>
                  <p className="text-sm text-slate-500">jogos no bolão</p>
                </div>

                <div>
                  <Link
                    href={`/boloes/${pool.code}`}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-fuchsia-200 bg-white text-xl font-bold text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-50"
                    aria-label={`Ver números do bolão ${pool.code}`}
                  >
                    +
                  </Link>
                </div>

                <div>
                  <Link
                    href={`/boloes/${pool.code}`}
                    className="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

