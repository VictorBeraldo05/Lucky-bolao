import Link from "next/link";
import { Contest, Lottery, LotteryGameType, Pool, PoolGame } from "@prisma/client";
import { Search } from "lucide-react";
import { formatCurrency, getPoolCommercialSummary } from "@/lib/utils";
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
    <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_20px_70px_rgba(188,131,230,0.12)]">
      <div className="hidden grid-cols-[1.45fr_1fr_0.75fr_0.95fr_0.8fr_0.7fr_0.85fr] gap-3 border-b border-fuchsia-100 bg-linear-to-r from-fuchsia-50 via-white to-violet-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:grid">
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
            <div key={pool.id} className="px-4 py-4 lg:px-5">
              <div className="space-y-4 lg:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-fuchsia-700">{pool.code}</p>
                      <StatusBadge status={pool.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-900">{pool.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-fuchsia-700">{formatCurrency(pool.sharePrice)}</p>
                    <p className="text-xs text-slate-500">por cota</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-fuchsia-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-500">Formato</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{summary.gamesLabel}</p>
                    <p className="text-xs text-slate-600">{summary.equivalentLabel ?? pool.relativeChance ?? "Cobertura ampliada"}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-500">Cotas</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {pool.availableShares}/{pool.totalShares}
                    </p>
                    <p className="text-xs text-slate-600">disponíveis</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/boloes/${pool.code}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-50"
                  >
                    <Search className="h-4 w-4" />
                    Ver números
                  </Link>
                  <Link
                    href={`/boloes/${pool.code}`}
                    className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
                  >
                    Comprar
                  </Link>
                </div>
              </div>

              <div className="hidden gap-4 lg:grid lg:grid-cols-[1.45fr_1fr_0.75fr_0.95fr_0.8fr_0.7fr_0.85fr] lg:items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-fuchsia-700">{pool.code}</p>
                    <StatusBadge status={pool.status} />
                  </div>
                  <p className="text-sm font-semibold leading-5 text-slate-900">{pool.title}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{summary.gamesLabel}</p>
                  <p className="text-xs text-slate-600">{summary.equivalentLabel ?? pool.relativeChance ?? "Cobertura ampliada"}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xl font-black text-fuchsia-700">{formatCurrency(pool.sharePrice)}</p>
                  <p className="text-xs text-slate-500">por cota</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">
                    {pool.availableShares}/{pool.totalShares}
                  </p>
                  <p className="text-xs text-slate-500">cotas disponíveis</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{pool.games.length.toString().padStart(2, "0")}</p>
                  <p className="text-xs text-slate-500">jogos</p>
                </div>

                <div className="hidden lg:block">
                  <Link
                    href={`/boloes/${pool.code}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-200 bg-white text-lg font-bold text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-50"
                    aria-label={`Ver números do bolão ${pool.code}`}
                  >
                    <Search className="h-4 w-4" />
                  </Link>
                </div>

                <div className="hidden lg:block">
                  <Link
                    href={`/boloes/${pool.code}`}
                    className="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
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
