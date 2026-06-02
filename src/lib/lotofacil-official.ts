type CaixaRateioPremio = {
  descricaoFaixa?: string;
  valorPremio?: number;
};

type CaixaLotofacilResponse = {
  numero?: number;
  listaDezenas?: string[];
  listaRateioPremio?: CaixaRateioPremio[];
  dataApuracao?: string;
};

export type OfficialLotofacilResult = {
  contestNumber: number;
  drawnNumbers: number[];
  prizeBreakdown: Record<string, number>;
  drawDate: string | null;
  source: string;
  raw: CaixaLotofacilResponse;
};

const LOTOFACIL_OFFICIAL_BASE_URL = "https://servicebus3.caixa.gov.br/portaldeloterias/api/lotofacil";

function normalizeDrawnNumbers(numbers: string[] | undefined) {
  return (numbers ?? [])
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((left, right) => left - right);
}

function normalizePrizeBreakdown(rateio: CaixaRateioPremio[] | undefined) {
  return (rateio ?? []).reduce<Record<string, number>>((accumulator, item) => {
    const match = item.descricaoFaixa?.match(/(\d+)/);
    const hits = match ? Number.parseInt(match[1], 10) : null;

    if (!hits) {
      return accumulator;
    }

    accumulator[String(hits)] = Number(item.valorPremio ?? 0);
    return accumulator;
  }, {});
}

async function fetchOfficialPayload(contestNumber?: number) {
  const url = contestNumber ? `${LOTOFACIL_OFFICIAL_BASE_URL}/${contestNumber}` : LOTOFACIL_OFFICIAL_BASE_URL;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: "https://loterias.caixa.gov.br/",
      Origin: "https://loterias.caixa.gov.br",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CAIXA retornou ${response.status} ao consultar a Lotofácil.`);
  }

  const payload = (await response.json()) as CaixaLotofacilResponse;
  const normalizedNumbers = normalizeDrawnNumbers(payload.listaDezenas);

  if (!payload.numero || normalizedNumbers.length !== 15) {
    throw new Error("A resposta oficial da Lotofácil veio incompleta.");
  }

  return {
    contestNumber: payload.numero,
    drawnNumbers: normalizedNumbers,
    prizeBreakdown: normalizePrizeBreakdown(payload.listaRateioPremio),
    drawDate: payload.dataApuracao ?? null,
    source: url,
    raw: payload,
  } satisfies OfficialLotofacilResult;
}

export async function fetchLatestOfficialLotofacilResult() {
  return fetchOfficialPayload();
}

export async function fetchOfficialLotofacilResultByContest(contestNumber: number) {
  return fetchOfficialPayload(contestNumber);
}
