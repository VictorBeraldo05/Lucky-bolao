"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, X } from "lucide-react";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";
import { NumberGrid } from "@/components/number-grid";
import { MobilePoolCard, type MobilePoolRow } from "@/components/mobile/mobile-pool-card";
import { formatCurrency, getPoolCommercialSummary } from "@/lib/utils";

type MobilePoolsListProps = {
  pools: MobilePoolRow[];
  isAuthenticated: boolean;
  title?: string;
  eyebrow?: string;
  actionHref?: string;
  actionLabel?: string;
};

type SortMode = "price-asc" | "price-desc" | "games-desc";

const sortLabels: Record<SortMode, string> = {
  "price-asc": "Menor valor",
  "price-desc": "Maior valor",
  "games-desc": "Mais jogos",
};

const sortOrder: SortMode[] = ["price-asc", "price-desc", "games-desc"];

export function MobilePoolsList({
  pools,
  isAuthenticated,
  title = "Bolões disponíveis",
  eyebrow = "Comprar agora",
  actionHref,
  actionLabel,
}: MobilePoolsListProps) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("price-asc");
  const [previewPool, setPreviewPool] = useState<MobilePoolRow | null>(null);
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
    setSortMode(sortOrder[(currentIndex + 1) % sortOrder.length]);
  }

  function handleBuyClick(poolCode: string, canBuy: boolean) {
    if (!canBuy) return;

    if (!isAuthenticated) {
      setAuthTargetCode(poolCode);
      return;
    }

    router.push(`/boloes/${poolCode}`);
  }

  return (
    <>
      <section className="space-y-4 md:hidden">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-500">{eyebrow}</p>
              <h2 className="mt-2 text-[2rem] font-black tracking-tight text-slate-900">{title}</h2>
            </div>
            {actionHref && actionLabel ? (
              <Link href={actionHref} className="shrink-0 text-sm font-semibold text-fuchsia-600">
                {actionLabel}
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            onClick={rotateSort}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-2 text-sm font-semibold text-fuchsia-700"
          >
            <ArrowUpDown className="h-4 w-4" />
            Ordenar: {sortLabels[sortMode]}
          </button>
        </div>

        <div className="space-y-3">
          {sortedPools.map((pool) => {
            const canBuy = pool.status === "OPEN" && pool.availableShares > 0;

            return (
              <MobilePoolCard
                key={pool.id}
                pool={pool}
                canBuy={canBuy}
                onPreview={() => setPreviewPool(pool)}
                onBuy={() => handleBuyClick(pool.code, canBuy)}
              />
            );
          })}
        </div>
      </section>

      {previewPool ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/55 backdrop-blur-sm md:hidden">
          <div className="max-h-[88dvh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-fuchsia-100 px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{previewPool.lottery.name}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{previewPool.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPool(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4">
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
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{summary.equivalentLabel}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {formatCurrency(previewPool.sharePrice)}/cota
                      </span>
                    </div>

                    <div className="rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/60 p-4">
                      <p className="text-sm leading-6 text-slate-600">{previewPool.description}</p>
                    </div>

                    <div className="space-y-3">
                      {previewPool.games.slice(0, 10).map((game) => (
                        <div key={game.id} className="rounded-[24px] border border-fuchsia-100 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-900">{game.title}</p>
                          <NumberGrid numbers={game.numbers} size="sm" />
                        </div>
                      ))}
                    </div>

                    {previewPool.games.length > 10 ? (
                      <p className="text-sm text-slate-500">
                        Mostrando os 10 primeiros jogos. Abra o bolão para ver a composição completa.
                      </p>
                    ) : null}
                  </>
                );
              })()}
            </div>

            <div className="border-t border-fuchsia-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  const canBuy = previewPool.status === "OPEN" && previewPool.availableShares > 0;
                  setPreviewPool(null);
                  handleBuyClick(previewPool.code, canBuy);
                }}
                disabled={previewPool.status !== "OPEN" || previewPool.availableShares < 1}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {previewPool.status === "OPEN" && previewPool.availableShares > 0 ? "Comprar cota" : "Bolão esgotado"}
              </button>
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
