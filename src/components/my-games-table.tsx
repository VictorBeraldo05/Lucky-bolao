"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy, X } from "lucide-react";
import { NumberGrid } from "@/components/number-grid";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type MyGameRow = {
  id: string;
  quantity: number;
  totalPrice: string;
  totalPrize: number;
  pool: {
    code: string;
    title: string;
    status: string;
    lotteryName: string;
    gameTypeName: string;
    contestNumber: number;
    drawDate: string;
    resultNumbers: number[];
    games: Array<{
      id: string;
      title: string;
      numbers: number[];
      hits: number | null;
      prizeAmount: string | null;
    }>;
  };
};

type ActiveTab = "resumo" | "sorteio" | "premiados" | "todos";
const GAMES_PER_PAGE = 8;

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-500">{label}</p>
      <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function MyGamesTable({ shares }: { shares: MyGameRow[] }) {
  const [selectedShare, setSelectedShare] = useState<MyGameRow | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("resumo");
  const [gamesPage, setGamesPage] = useState(0);

  const awardedGames = useMemo(
    () =>
      selectedShare?.pool.games.filter((game) => {
        const prizeAmount = Number(game.prizeAmount ?? 0);
        return prizeAmount > 0 || (game.hits ?? 0) > 0;
      }) ?? [],
    [selectedShare],
  );

  function openShareDetails(share: MyGameRow) {
    setSelectedShare(share);
    setActiveTab("resumo");
    setGamesPage(0);
  }

  const paginatedGames = useMemo(() => {
    if (!selectedShare) return [];
    return selectedShare.pool.games.slice(gamesPage * GAMES_PER_PAGE, gamesPage * GAMES_PER_PAGE + GAMES_PER_PAGE);
  }, [gamesPage, selectedShare]);

  const totalGamePages = selectedShare ? Math.max(1, Math.ceil(selectedShare.pool.games.length / GAMES_PER_PAGE)) : 1;

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Loteria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concurso</th>
                <th className="px-4 py-3">Cotas</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prêmio</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => (
                <tr key={share.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{share.pool.lotteryName}</td>
                  <td className="px-4 py-3">{share.pool.gameTypeName}</td>
                  <td className="px-4 py-3">
                    #{share.pool.contestNumber}
                    <div className="text-xs text-slate-500">{formatDate(share.pool.drawDate)}</div>
                  </td>
                  <td className="px-4 py-3">{share.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(share.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={share.pool.status} />
                  </td>
                  <td className="px-4 py-3">{formatCurrency(share.totalPrize)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openShareDetails(share)}
                      className="font-semibold text-fuchsia-700 transition hover:text-fuchsia-800"
                    >
                      Ver resumo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedShare ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-fuchsia-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-500">{selectedShare.pool.lotteryName}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedShare.pool.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bolão {selectedShare.pool.code} • Concurso #{selectedShare.pool.contestNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShare(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-100 bg-white text-slate-500 transition hover:border-fuchsia-200 hover:text-fuchsia-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-fuchsia-100 px-5 py-3 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "resumo", label: "Resumo" },
                  { id: "sorteio", label: "Sorteio" },
                  { id: "premiados", label: "Premiados" },
                  { id: "todos", label: "Todos os jogos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.id ? "bg-fuchsia-600 text-white" : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-5 py-5 sm:px-6">
              {activeTab === "resumo" ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Suas cotas" value={String(selectedShare.quantity)} />
                    <SummaryCard label="Valor pago" value={formatCurrency(selectedShare.totalPrice)} />
                    <SummaryCard label="Status" value={selectedShare.pool.status.replaceAll("_", " ")} />
                    <SummaryCard label="Prêmio total" value={formatCurrency(selectedShare.totalPrize)} />
                  </div>

                  <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/40 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Resumo do bolão adquirido</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Você participa deste bolão com {selectedShare.quantity} cota(s). Abaixo estão os jogos vinculados a ele.
                        </p>
                      </div>
                      <StatusBadge status={selectedShare.pool.status} />
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {selectedShare.pool.games.slice(0, 6).map((game) => (
                        <div key={game.id} className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
                          <p className="font-semibold text-slate-900">{game.title}</p>
                          <div className="mt-3">
                            <NumberGrid numbers={game.numbers} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedShare.pool.games.length > 6 ? (
                      <p className="mt-4 text-sm text-slate-500">
                        Exibindo os 6 primeiros jogos deste bolão. Total de jogos: {selectedShare.pool.games.length}.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeTab === "sorteio" ? (
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/40 p-5">
                    <h3 className="text-lg font-bold text-slate-900">Resultado do sorteio</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Concurso #{selectedShare.pool.contestNumber} • Sorteio em {formatDate(selectedShare.pool.drawDate)}
                    </p>
                    {selectedShare.pool.resultNumbers.length > 0 ? (
                      <div className="mt-5">
                        <NumberGrid numbers={selectedShare.pool.resultNumbers} highlight={selectedShare.pool.resultNumbers} />
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-fuchsia-200 bg-white p-5 text-sm text-slate-500">
                        O resultado deste concurso ainda não foi publicado.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-fuchsia-100 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900">Conferência rápida</h3>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      {selectedShare.pool.games.slice(0, 4).map((game) => (
                        <div key={game.id} className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">{game.title}</p>
                            {game.hits !== null ? <span className="text-sm font-semibold text-fuchsia-700">{game.hits} acertos</span> : null}
                          </div>
                          <div className="mt-3">
                            <NumberGrid numbers={game.numbers} highlight={selectedShare.pool.resultNumbers} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "premiados" ? (
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/40 p-5">
                    <h3 className="text-lg font-bold text-slate-900">Bilhetes premiados do bolão</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Veja os jogos deste bolão que registraram prêmio ou acertos após a apuração.
                    </p>
                  </div>

                  {awardedGames.length > 0 ? (
                    <div className="grid gap-4">
                      {awardedGames.map((game) => (
                        <div key={game.id} className="rounded-[28px] border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <Trophy className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="font-bold text-slate-900">{game.title}</p>
                                <p className="text-sm text-slate-600">{game.hits ?? 0} acertos</p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm text-slate-500">Prêmio apurado</p>
                              <p className="text-lg font-bold text-emerald-700">{formatCurrency(game.prizeAmount ?? 0)}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <NumberGrid numbers={game.numbers} highlight={selectedShare.pool.resultNumbers} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-fuchsia-200 bg-white p-6 text-sm text-slate-500">
                      Ainda não há bilhetes premiados vinculados a este bolão.
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "todos" ? (
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-fuchsia-100 bg-fuchsia-50/40 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Todos os jogos do bolão</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Navegue pelos jogos em blocos menores. Os números destacados representam as dezenas sorteadas neste concurso.
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                        Página {gamesPage + 1} de {totalGamePages}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {paginatedGames.map((game) => (
                        <div key={game.id} className="rounded-[24px] border border-white/80 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">{game.title}</p>
                            {game.hits !== null ? (
                              <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                                {game.hits} acertos
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-4">
                            <NumberGrid numbers={game.numbers} highlight={selectedShare?.pool.resultNumbers ?? []} size="sm" />
                          </div>
                          {Number(game.prizeAmount ?? 0) > 0 ? (
                            <p className="mt-4 text-sm font-semibold text-emerald-700">Premiado: {formatCurrency(game.prizeAmount ?? 0)}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">
                        Exibindo jogos {gamesPage * GAMES_PER_PAGE + 1} a {Math.min((gamesPage + 1) * GAMES_PER_PAGE, selectedShare?.pool.games.length ?? 0)} de{" "}
                        {selectedShare?.pool.games.length ?? 0}.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGamesPage((page) => Math.max(0, page - 1))}
                          disabled={gamesPage === 0}
                          className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setGamesPage((page) => Math.min(totalGamePages - 1, page + 1))}
                          disabled={gamesPage >= totalGamePages - 1}
                          className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-50"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
