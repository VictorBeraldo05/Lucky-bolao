"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Contest, Lottery, LotteryGameType, Pool, PoolGame } from "@prisma/client";
import { ArrowUpDown, Search, X } from "lucide-react";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";
import { cn, formatCurrency, getPoolCommercialSummary } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { NumberGrid } from "@/components/number-grid";

type PoolRow = Pool & {
  lottery: Lottery;
  gameType: LotteryGameType;
  contest: Contest;
  games: PoolGame[];
};

type PoolTableProps = {
  pools: PoolRow[];
  isAuthenticated?: boolean;
};

type SortMode = "price-asc" | "price-desc" | "games-desc";

const sortLabels: Record<SortMode, string> = {
  "price-asc": "Menor valor",
  "price-desc": "Maior valor",
  "games-desc": "Mais jogos",
};

const sortOrder: SortMode[] = ["price-asc", "price-desc", "games-desc"];

export function PoolTable({ pools, isAuthenticated = false }: PoolTableProps) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("price-asc");
  const [previewPool, setPreviewPool] = useState<PoolRow | null>(null);
  const [authTargetCode, setAuthTargetCode] = useState<string | null>(null);

  const sortedPools = useMemo(() => {
    const items = [...pools];

    items.sort((a, b) => {
      if (sortMode === "price-asc") return Number(a.sharePrice) - Number(b.sharePrice);
      if (sortMode === "price-desc") return Number(b.sharePrice) - Number(a.sharePrice);
      return b.games.length - a.games.length;
    });

    return items;
  }, [pools, sortMode]);

  function rotateSort() {
    const currentIndex = sortOrder.indexOf(sortMode);
    const nextIndex = (currentIndex + 1) % sortOrder.length;
    setSortMode(sortOrder[nextIndex]);
  }

  function handleBuyClick(poolCode: string) {
    if (!isAuthenticated) {
      setAuthTargetCode(poolCode);
      return;
    }

    router.push(`/boloes/${poolCode}`);
  }

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_20px_70px_rgba(188,131,230,0.12)]">
        <div className="flex items-center justify-between gap-3 border-b border-fuchsia-100 bg-linear-to-r from-fuchsia-50 via-white to-violet-50 px-4 py-3 lg:px-5">
          <p className="text-sm font-semibold text-slate-600">
            <span className="lg:hidden">Escolha seu bolão</span>
            <span className="hidden lg:inline">Compare as opções e compre suas cotas sem sair da lista.</span>
          </p>
          <button
            onClick={rotateSort}
            className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
          >
            <ArrowUpDown className="h-4 w-4" />
            Ordenar: {sortLabels[sortMode]}
          </button>
        </div>

        <div className="hidden grid-cols-[1.45fr_1fr_0.75fr_0.95fr_0.8fr_0.7fr_0.85fr] gap-3 border-b border-fuchsia-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:grid">
          <div>Bolão</div>
          <div>Chances</div>
          <div>Valor</div>
          <div>Divisão de cotas</div>
          <div>Opções de jogos</div>
          <div>Ver números</div>
          <div>Comprar</div>
        </div>

        <div className="divide-y divide-fuchsia-50">
          {sortedPools.map((pool, index) => {
            const summary = getPoolCommercialSummary({
              relativeChance: pool.relativeChance,
              description: pool.description,
              totalShares: pool.totalShares,
              sharePrice: pool.sharePrice,
              gamesCount: pool.games.length,
            });

            return (
              <div key={pool.id} className={cn("px-4 py-4 lg:px-5", index % 2 === 1 && "bg-fuchsia-50/30")}>
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
                      <p className="text-xs text-slate-600">
                        {summary.equivalentLabel ?? pool.relativeChance ?? "Cobertura ampliada"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-500">Cotas</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {pool.availableShares}/{pool.totalShares}
                      </p>
                      <p className="text-xs text-slate-600">cotas disponíveis</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPreviewPool(pool)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-50"
                    >
                      <Search className="h-4 w-4" />
                      Ver números
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuyClick(pool.code)}
                      className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
                    >
                      Comprar
                    </button>
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
                    <p className="text-xs text-slate-600">
                      {summary.equivalentLabel ?? pool.relativeChance ?? "Cobertura ampliada"}
                    </p>
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
                    <button
                      onClick={() => setPreviewPool(pool)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-200 bg-white text-lg font-bold text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-50"
                      aria-label={`Ver números do bolão ${pool.code}`}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="hidden lg:block">
                    <button
                      type="button"
                      onClick={() => handleBuyClick(pool.code)}
                      className="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {previewPool ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[32px]">
            <div className="flex items-center justify-between border-b border-fuchsia-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-500">{previewPool.lottery.name}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{previewPool.title}</h3>
              </div>
              <button
                onClick={() => setPreviewPool(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="Fechar visualização"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-5 py-5 sm:px-6">
              {(() => {
                const summary = getPoolCommercialSummary({
                  relativeChance: previewPool.relativeChance,
                  description: previewPool.description,
                  totalShares: previewPool.totalShares,
                  sharePrice: previewPool.sharePrice,
                  gamesCount: previewPool.games.length,
                });

                return (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">{summary.gamesLabel}</span>
                      {summary.equivalentLabel ? (
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{summary.equivalentLabel}</span>
                      ) : null}
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{summary.sharesLabel}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{summary.sharePriceLabel}</span>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-[24px] bg-fuchsia-50/60 p-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-500">Bolão</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{previewPool.code}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-500">Concurso</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">#{previewPool.contest.contestNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-500">Cotas</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{previewPool.availableShares}/{previewPool.totalShares}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-500">Valor</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(previewPool.sharePrice)}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-fuchsia-100 bg-white p-4">
                      <p className="text-lg font-bold text-slate-900">Composição</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{previewPool.description}</p>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-fuchsia-100 bg-white p-4">
                      <p className="text-lg font-bold text-slate-900">Jogos</p>
                      <div className="mt-4 space-y-4">
                        {previewPool.games.slice(0, 12).map((game) => (
                          <div key={game.id} className="rounded-[20px] bg-fuchsia-50/60 p-3">
                            <p className="mb-3 text-sm font-semibold text-slate-900">{game.title}</p>
                            <NumberGrid numbers={game.numbers} size="sm" />
                          </div>
                        ))}
                      </div>
                      {previewPool.games.length > 12 ? (
                        <p className="mt-4 text-sm text-slate-500">
                          Mostrando os 12 primeiros jogos. Abra o bolão para ver a composição completa.
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => setPreviewPool(null)}
                        className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 bg-white px-5 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
                      >
                        Fechar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBuyClick(previewPool.code)}
                        className="inline-flex items-center justify-center rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
                      >
                        Comprar este bolão
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      <AuthRequiredDialog
        isOpen={Boolean(authTargetCode)}
        onClose={() => setAuthTargetCode(null)}
        redirectPath={authTargetCode ? `/boloes/${authTargetCode}` : "/login"}
      />
    </>
  );
}
