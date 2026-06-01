import crypto from "crypto";

type MercadoPagoPayment = {
  id?: string;
  external_reference?: string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  date_of_expiration?: string;
  payer?: {
    identification?: {
      number?: string;
    };
  };
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      expiration_date?: string;
      ticket_url?: string;
    };
  };
  transaction_details?: {
    external_resource_url?: string;
  };
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente ${name} não configurada.`);
  }
  return value;
}

export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export function getMercadoPagoBaseUrl() {
  return process.env.MERCADOPAGO_BASE_URL?.trim() || "https://api.mercadopago.com";
}

export function getPaymentBackendBaseUrl() {
  return process.env.PAYMENT_BACKEND_BASE_URL?.trim() || "";
}

export function getPaymentBackendApiKey() {
  return process.env.PAYMENT_BACKEND_API_KEY?.trim() || "";
}

export function getBackendPublicUrl() {
  return process.env.BACKEND_PUBLIC_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
}

export function getMercadoPagoAccessToken() {
  return getEnv("MERCADOPAGO_ACCESS_TOKEN");
}

export function getMercadoPagoWebhookSecret() {
  return getEnv("MERCADOPAGO_WEBHOOK_SECRET");
}

export function getMercadoPagoChargeExpirationMinutes() {
  const minutes = Number(process.env.MERCADOPAGO_CHARGE_EXPIRATION_MINUTES ?? "15");
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 15;
}

export function allowApprovedWithoutCpf() {
  return String(process.env.MERCADOPAGO_ALLOW_APPROVED_WITHOUT_CPF ?? "false").toLowerCase() === "true";
}

export function allowApprovedWithMismatchedCpf() {
  return String(process.env.MERCADOPAGO_ALLOW_APPROVED_WITH_MISMATCHED_CPF ?? "false").toLowerCase() === "true";
}

function getPaymentBackendHeaders() {
  const apiKey = getPaymentBackendApiKey();
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["x-payment-backend-key"] = apiKey;
  }
  return headers;
}

async function parseBackendResponse(result: Response) {
  if (!result.ok) {
    const payload = await result.text();
    throw new Error(`Backend de pagamentos retornou erro: ${result.status} ${payload}`);
  }

  return result.json() as Promise<MercadoPagoPayment>;
}

export function validateMercadoPagoSignature(signature: string | null, requestId: string | null, fullUrl: string) {
  if (!signature || !requestId) return false;
  const secret = getMercadoPagoWebhookSecret();
  const parts = Object.fromEntries(
    signature
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")];
      }),
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const url = new URL(fullUrl);
  const dataId = (url.searchParams.get("data.id") || url.searchParams.get("id") || "").toLowerCase();
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function createPixPaymentDirect(params: {
  email: string;
  name: string;
  cpf: string;
  title: string;
  amount: number | string;
  referenceId?: string;
}) {
  const backendPublicUrl = getBackendPublicUrl();
  if (!backendPublicUrl) {
    throw new Error("BACKEND_PUBLIC_URL ou NEXT_PUBLIC_APP_URL nao configurado para o webhook do Mercado Pago.");
  }

  const result = await fetch(`${getMercadoPagoBaseUrl()}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: Number(params.amount),
      description: params.title,
      payment_method_id: "pix",
      external_reference: params.referenceId ? String(params.referenceId) : undefined,
      notification_url: `${backendPublicUrl.replace(/\/$/, "")}/wallet/webhooks/mercadopago`,
      payer: {
        email: params.email,
        first_name: params.name,
        identification: {
          type: "CPF",
          number: normalizeCpf(params.cpf),
        },
      },
      additional_info: {
        items: [
          {
            id: params.referenceId ? String(params.referenceId) : "0",
            title: params.title,
            description: params.referenceId ? `Checkout ${params.referenceId}` : params.title,
            quantity: 1,
            unit_price: Number(params.amount),
          },
        ],
      },
    }),
  });

  if (!result.ok) {
    const payload = await result.text();
    throw new Error(`Mercado Pago retornou erro: ${result.status} ${payload}`);
  }

  return result.json() as Promise<MercadoPagoPayment>;
}

export async function fetchPixPaymentStatus(providerChargeId: string) {
  const backendBaseUrl = getPaymentBackendBaseUrl();
  if (backendBaseUrl) {
    const result = await fetch(`${backendBaseUrl}/v1/payments/${providerChargeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getPaymentBackendHeaders(),
      },
    });

    return parseBackendResponse(result);
  }

  return fetchPixPaymentStatusDirect(providerChargeId);
}

export async function createPixPayment(params: {
  email: string;
  name: string;
  cpf: string;
  title: string;
  amount: number | string;
  referenceId?: string;
}) {
  const backendBaseUrl = getPaymentBackendBaseUrl();
  if (backendBaseUrl) {
    const result = await fetch(`${backendBaseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getPaymentBackendHeaders(),
      },
      body: JSON.stringify(params),
    });

    return parseBackendResponse(result);
  }

  return createPixPaymentDirect(params);
}

export async function fetchPixPaymentStatusDirect(providerChargeId: string) {
  const result = await fetch(`${getMercadoPagoBaseUrl()}/v1/payments/${providerChargeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!result.ok) {
    const payload = await result.text();
    throw new Error(`Mercado Pago retornou erro ao consultar pagamento: ${result.status} ${payload}`);
  }

  return result.json();
}

export function determineTopupStatus(payment: MercadoPagoPayment, expectedCpf?: string | null) {
  const normalizedExpected = expectedCpf ? normalizeCpf(expectedCpf) : null;
  const payerCpf = payment.payer?.identification?.number ? normalizeCpf(payment.payer.identification.number) : null;
  const status = String(payment.status ?? "").toLowerCase();
  const statusDetail = String(payment.status_detail ?? "").toLowerCase();

  if (status === "approved") {
    if (!payerCpf || !normalizedExpected || payerCpf === normalizedExpected) {
      return "PAID";
    }

    return allowApprovedWithMismatchedCpf() ? "PAID" : "MANUAL_REVIEW";
  }

  if (status === "pending" || status === "in_process" || status === "in_mediation") {
    return "PENDING";
  }

  if (status === "cancelled" || status === "refunded" || status === "rejected" || statusDetail.includes("rejected")) {
    return "REJECTED";
  }

  if (status === "expired") {
    return "EXPIRED";
  }

  return "PENDING";
}

export function parsePaymentTopupData(payment: MercadoPagoPayment) {
  const interaction = payment.point_of_interaction?.transaction_data;
  const qrCodeBase64 = interaction?.qr_code_base64 ? `data:image/png;base64,${interaction.qr_code_base64}` : "";
  return {
    providerChargeId: String(payment.id ?? ""),
    qrCodeText: String(interaction?.qr_code ?? ""),
    qrCodeImageBase64: qrCodeBase64,
    paymentLinkUrl: String(interaction?.ticket_url ?? payment.transaction_details?.external_resource_url ?? ""),
    expiresAt: payment.date_of_expiration || interaction?.expiration_date ? new Date(payment.date_of_expiration ?? interaction?.expiration_date ?? "").toISOString() : null,
    providerPayload: payment,
  };
}
