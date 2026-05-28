import crypto from "crypto";
import { Prisma } from "@prisma/client";

type MercadoPagoPayment = {
  id?: string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
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
  return process.env.MERCADOPAGO_BASE_URL ?? "https://api.mercadopago.com";
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

export function validateMercadoPagoSignature(signature: string | null, payload: string) {
  if (!signature) return false;
  const secret = getMercadoPagoWebhookSecret();
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("base64");
  return signature === digest;
}

export async function createPixPayment(params: {
  email: string;
  name: string;
  cpf: string;
  title: string;
  packageId: number;
  price: number | string;
}) {
  const result = await fetch(`${getMercadoPagoBaseUrl()}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_amount: Number(params.price),
      description: params.title,
      payment_method_id: "pix",
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
            id: String(params.packageId),
            title: params.title,
            description: `Top-up ${params.title}`,
            quantity: 1,
            unit_price: Number(params.price),
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
    if (!payerCpf) {
      return allowApprovedWithoutCpf() ? "PAID" : "MANUAL_REVIEW";
    }

    if (!normalizedExpected) {
      return allowApprovedWithoutCpf() ? "PAID" : "MANUAL_REVIEW";
    }

    if (payerCpf === normalizedExpected) {
      return "PAID";
    }

    return allowApprovedWithMismatchedCpf() ? "PAID" : "REJECTED";
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
  return {
    providerChargeId: String(payment.id ?? ""),
    qrCodeText: String(interaction?.qr_code ?? ""),
    qrCodeImageBase64: String(interaction?.qr_code_base64 ?? ""),
    paymentLinkUrl: String(payment.transaction_details?.external_resource_url ?? interaction?.qr_code_base64 ?? ""),
    expiresAt: interaction?.expiration_date ? new Date(interaction.expiration_date).toISOString() : null,
    providerPayload: payment,
  };
}
