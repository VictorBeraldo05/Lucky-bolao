import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { fetchPixPaymentStatus, validateMercadoPagoSignature, determineTopupStatus } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { syncWalletTopup } from "@/lib/wallet";

function mapToPaymentStatus(status: string) {
  if (status === "PAID") return PaymentStatus.APPROVED;
  if (status === "PENDING") return PaymentStatus.PENDING;
  return PaymentStatus.CANCELED;
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  const url = new URL(request.url);
  const signature =
    request.headers.get("x-signature") ||
    request.headers.get("x-mercadopago-signature") ||
    request.headers.get("x-meli-signature") ||
    request.headers.get("x-hub-signature") ||
    request.headers.get("x-hub-signature-256");
  const requestId = request.headers.get("x-request-id");

  if (!validateMercadoPagoSignature(signature, bodyText)) {
    return NextResponse.json({ message: "Assinatura invalida." }, { status: 403 });
  }

  let payload: unknown = null;
  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
    }
  }

  const event = {
    data: (payload as any)?.data ?? undefined,
    id: (payload as any)?.id ?? undefined,
    resource: (payload as any)?.resource ?? undefined,
    payment_id: (payload as any)?.payment_id ?? undefined,
  } as {
    data?: { id?: string; object?: { id?: string } };
    id?: string;
    resource?: { id?: string };
    payment_id?: string;
  };

  if (!event.data?.id && url.searchParams.has("data.id")) {
    event.data = { ...event.data, id: url.searchParams.get("data.id") ?? undefined };
  }
  if (!event.id && url.searchParams.has("id")) {
    event.id = url.searchParams.get("id") ?? undefined;
  }
  if (!event.resource?.id && url.searchParams.has("resource.id")) {
    event.resource = { id: url.searchParams.get("resource.id") ?? undefined };
  }
  if (!event.payment_id && url.searchParams.has("payment_id")) {
    event.payment_id = url.searchParams.get("payment_id") ?? undefined;
  }

  const providerChargeId =
    event.data?.id || event.id || event.resource?.id || event.payment_id || event.data?.object?.id;

  if (!providerChargeId) {
    return NextResponse.json({ message: "ID de pagamento nao encontrado." }, { status: 400 });
  }

  const topup = await prisma.walletTopup.findFirst({ where: { providerChargeId: String(providerChargeId) } });
  if (topup) {
    try {
      const updatedTopup = await syncWalletTopup(topup.id, requestId ?? undefined);
      return NextResponse.json({ topup: updatedTopup });
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao sincronizar topup." }, { status: 400 });
    }
  }

  const payment = await prisma.payment.findFirst({ where: { reference: String(providerChargeId), method: "pix" } });
  if (!payment) {
    return NextResponse.json({ message: "Pagamento nao encontrado." }, { status: 404 });
  }

  try {
    const providerPayment = await fetchPixPaymentStatus(String(providerChargeId));
    const status = determineTopupStatus(providerPayment);
    const paymentStatus = mapToPaymentStatus(status);

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: paymentStatus },
    });

    if (paymentStatus === PaymentStatus.APPROVED) {
      const metadata = payment.metadata as { cartId?: string } | null | undefined;
      const cartId = metadata?.cartId;
      if (cartId) {
        await prisma.cart.updateMany({
          where: { id: cartId, status: "OPEN" },
          data: { status: "CHECKED_OUT" },
        });
      }
    }

    return NextResponse.json({ payment: updatedPayment });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao sincronizar pagamento." }, { status: 400 });
  }
}
