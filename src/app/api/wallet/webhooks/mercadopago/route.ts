import { NextResponse } from "next/server";
import { validateMercadoPagoSignature } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { syncWalletTopup } from "@/lib/wallet";

export async function POST(request: Request) {
  const bodyText = await request.text();
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!validateMercadoPagoSignature(signature, bodyText)) {
    return NextResponse.json({ message: "Assinatura invalida." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const event = payload as {
    data?: { id?: string; object?: { id?: string } };
    id?: string;
    resource?: { id?: string };
    payment_id?: string;
  };

  const providerChargeId =
    event.data?.id || event.id || event.resource?.id || event.payment_id || event.data?.object?.id;

  if (!providerChargeId) {
    return NextResponse.json({ message: "ID de pagamento nao encontrado." }, { status: 400 });
  }

  const topup = await prisma.walletTopup.findFirst({ where: { providerChargeId: String(providerChargeId) } });
  if (!topup) {
    return NextResponse.json({ message: "Topup nao encontrado." }, { status: 404 });
  }

  try {
    const updatedTopup = await syncWalletTopup(topup.id, requestId ?? undefined);
    return NextResponse.json({ topup: updatedTopup });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao sincronizar topup." }, { status: 400 });
  }
}
