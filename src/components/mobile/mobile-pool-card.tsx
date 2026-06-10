"use client";

import { Search } from "lucide-react";
import { Contest, Lottery, LotteryGameType, Pool, PoolGame } from "@prisma/client";
import { formatCurrency, getPoolCommercialSummary } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export type MobilePoolRow = Pool & {
  lottery: Lottery;
  gameType: LotteryGameType;
  contest: Contest;
  games: PoolGame[];
};

type MobilePoolCardProps = {
  pool: MobilePoolRow;
  onPreview: () => void;
  onBuy: () => void;
  canBuy: boolean;
};

export function MobilePoolCard({ pool, onPreview, onBuy, canBuy }: MobilePoolCardProps) {
  const summary = getPoolCommercialSummary({
    relativeChance: pool.relativeChance,
    description: pool.description,
    totalShares: pool.totalShares,
    sharePrice: pool.sharePrice,
    gamesCount: pool.games.length,
  });

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_40px_rgba(188,131,230,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black tracking-wide text-fuchsia-700">{pool.code}</p>
            <StatusBadge status={pool.status} />
          </div>
          <h3 className="mt-2 text-lg font-bold leading-6 text-slate-900">{pool.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black text-fuchsia-700">{formatCurrency(pool.sharePrice)}</p>
          <p className="text-xs text-slate-500">por cota</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-fuchsia-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-500">Jogos</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{summary.gamesLabel}</p>
          <p className="text-xs text-slate-500">{summary.equivalentLabel}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-500">Cotas</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {pool.availableShares}/{pool.totalShares}
          </p>
          <p className="text-xs text-slate-500">disponíveis</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-700"
        >
          <Search className="h-4 w-4" />
          Ver números
        </button>
        <button
          type="button"
          onClick={onBuy}
          disabled={!canBuy}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {canBuy ? "Comprar" : "Esgotado"}
        </button>
      </div>
    </article>
  );
}
