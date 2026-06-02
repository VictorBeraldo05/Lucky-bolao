type CaixaRateioPremio = {
  descricaoFaixa?: string;
  valorPremio?: number;
};

type CaixaLotofacilResponse = {
  numero?: number;
  listaDezenas?: string[];
  listaRateioPremio?: CaixaRateioPremio[];
  dataApuracao?: string;
  dataProximoConcurso?: string;
};

type ApiLoteriasPrize = {
  quantidade_de_acertos?: string;
  valor_do_premio?: number | string;
};

type ApiLoteriasResponse = {
  numero_concurso?: number;
  data_concurso?: string;
  data_proximo_concurso?: string;
  dezenas?: string[];
  premiacao?: ApiLoteriasPrize[];
};

type BackupLoteriasResponse = {
  concurso?: number;
  data?: string;
  dezenas?: string[];
  premiacoes?: Array<{
    acertos?: number | string;
    premio?: number | string;
  }>;
};

export type OfficialLotofacilResult = {
  contestNumber: number;
  drawnNumbers: number[];
  prizeBreakdown: Record<string, number>;
  drawDate: string | null;
  nextDrawDate: string | null;
  source: string;
  raw: unknown;
};

const LOTOFACIL_OFFICIAL_BASE_URL = "https://servicebus3.caixa.gov.br/portaldeloterias/api/lotofacil";
const API_LOTERIAS_BASE_URL = "https://apiloterias.com/v1/lotofacil";
const BACKUP_API_BASE_URL = "https://raw.githubusercontent.com/maickon/free-apiloterias/refs/heads/master/database/lotofacil";

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

function normalizeCurrencyLikeNumber(value: unknown) {
  const normalized = String(value ?? "0")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCaixaPayload(payload: CaixaLotofacilResponse, source: string): OfficialLotofacilResult {
  const normalizedNumbers = normalizeDrawnNumbers(payload.listaDezenas);

  if (!payload.numero || normalizedNumbers.length !== 15) {
    throw new Error("A resposta oficial da Lotofácil veio incompleta.");
  }

  return {
    contestNumber: payload.numero,
    drawnNumbers: normalizedNumbers,
    prizeBreakdown: normalizePrizeBreakdown(payload.listaRateioPremio),
    drawDate: payload.dataApuracao ?? null,
    nextDrawDate: payload.dataProximoConcurso ?? null,
    source,
    raw: payload,
  };
}

function normalizeApiLoteriasPrizeBreakdown(premiacao: ApiLoteriasPrize[] | undefined) {
  return (premiacao ?? []).reduce<Record<string, number>>((accumulator, item) => {
    const match = item.quantidade_de_acertos?.match(/(\d+)/);
    const hits = match ? Number.parseInt(match[1], 10) : null;

    if (!hits) {
      return accumulator;
    }

    accumulator[String(hits)] = normalizeCurrencyLikeNumber(item.valor_do_premio);
    return accumulator;
  }, {});
}

function normalizeApiLoteriasPayload(payload: ApiLoteriasResponse, source: string): OfficialLotofacilResult {
  const normalizedNumbers = normalizeDrawnNumbers(payload.dezenas);

  if (!payload.numero_concurso || normalizedNumbers.length !== 15) {
    throw new Error("A resposta da API de terceiros da Lotofácil veio incompleta.");
  }

  return {
    contestNumber: payload.numero_concurso,
    drawnNumbers: normalizedNumbers,
    prizeBreakdown: normalizeApiLoteriasPrizeBreakdown(payload.premiacao),
    drawDate: payload.data_concurso ?? null,
    nextDrawDate: payload.data_proximo_concurso ?? null,
    source,
    raw: payload,
  };
}

function normalizeBackupPrizeBreakdown(premiacoes: BackupLoteriasResponse["premiacoes"]) {
  return (premiacoes ?? []).reduce<Record<string, number>>((accumulator, item) => {
    const hits = item.acertos ? Number.parseInt(String(item.acertos), 10) : null;

    if (!hits) {
      return accumulator;
    }

    accumulator[String(hits)] = normalizeCurrencyLikeNumber(item.premio);
    return accumulator;
  }, {});
}

function normalizeBackupPayload(payload: BackupLoteriasResponse, source: string): OfficialLotofacilResult {
  const normalizedNumbers = normalizeDrawnNumbers(payload.dezenas);

  if (!payload.concurso || normalizedNumbers.length !== 15) {
    throw new Error("A resposta da API de backup da Lotofácil veio incompleta.");
  }

  return {
    contestNumber: payload.concurso,
    drawnNumbers: normalizedNumbers,
    prizeBreakdown: normalizeBackupPrizeBreakdown(payload.premiacoes),
    drawDate: payload.data ?? null,
    nextDrawDate: null,
    source,
    raw: payload,
  };
}

async function fetchLotofacilFromApiLoterias(contestNumber?: number) {
  const apiKey = process.env.LOTTERY_RESULTS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const url = contestNumber
    ? `${API_LOTERIAS_BASE_URL}/${apiKey}/${contestNumber}`
    : `${API_LOTERIAS_BASE_URL}/${apiKey}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API de resultados retornou ${response.status} ao consultar a Lotofácil.`);
  }

  const payload = (await response.json()) as ApiLoteriasResponse;
  return normalizeApiLoteriasPayload(payload, url);
}

async function fetchLotofacilDirect(contestNumber?: number) {
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
  return normalizeCaixaPayload(payload, url);
}

async function fetchLotofacilFromProxy(contestNumber?: number) {
  const baseUrl = process.env.LOTTERY_RESULTS_PROXY_BASE_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    return null;
  }

  const path = contestNumber
    ? `/api/public/results/lotofacil/${contestNumber}`
    : "/api/public/results/lotofacil";

  const proxyUrl = `${baseUrl}${path}`;
  const secret = process.env.LOTTERY_RESULTS_PROXY_SECRET;
  const response = await fetch(proxyUrl, {
    headers: {
      Accept: "application/json, text/plain, */*",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Proxy de resultados retornou ${response.status} ao consultar a Lotofácil.`);
  }

  const payload = (await response.json()) as OfficialLotofacilResult;

  if (!payload.contestNumber || !Array.isArray(payload.drawnNumbers) || !payload.drawnNumbers.length) {
    throw new Error("O proxy de resultados da Lotofácil respondeu sem dados válidos.");
  }

  return payload;
}

async function fetchLotofacilFromBackup(contestNumber?: number) {
  const suffix = contestNumber ? `${contestNumber}.json` : "_ultimo.json";
  const url = `${BACKUP_API_BASE_URL}/${suffix}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API de backup retornou ${response.status} ao consultar a Lotofácil.`);
  }

  const payload = (await response.json()) as BackupLoteriasResponse;
  return normalizeBackupPayload(payload, url);
}

async function trySource(loader: () => Promise<OfficialLotofacilResult | null>) {
  try {
    return await loader();
  } catch {
    return null;
  }
}

export async function fetchLatestOfficialLotofacilResultDirect() {
  return fetchLotofacilDirect();
}

export async function fetchOfficialLotofacilResultByContestDirect(contestNumber: number) {
  return fetchLotofacilDirect(contestNumber);
}

export async function fetchLatestOfficialLotofacilResult() {
  const result =
    (await trySource(() => fetchLotofacilFromApiLoterias())) ??
    (await trySource(() => fetchLotofacilFromProxy())) ??
    (await trySource(() => fetchLotofacilDirect())) ??
    (await trySource(() => fetchLotofacilFromBackup()));

  if (!result) {
    throw new Error("Não foi possível consultar o resultado da Lotofácil em nenhuma fonte disponível.");
  }

  return result;
}

export async function fetchOfficialLotofacilResultByContest(contestNumber: number) {
  const result =
    (await trySource(() => fetchLotofacilFromApiLoterias(contestNumber))) ??
    (await trySource(() => fetchLotofacilFromProxy(contestNumber))) ??
    (await trySource(() => fetchLotofacilDirect(contestNumber))) ??
    (await trySource(() => fetchLotofacilFromBackup(contestNumber)));

  if (!result) {
    throw new Error(`Não foi possível consultar o concurso ${contestNumber} da Lotofácil em nenhuma fonte disponível.`);
  }

  return result;
}
