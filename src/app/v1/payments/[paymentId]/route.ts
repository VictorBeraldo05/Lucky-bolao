import { NextResponse } from "next/server";
import { fetchPixPaymentStatusDirect, getPaymentBackendApiKey } from "@/lib/mercadopago";

function isAuthorized(request: Request) {
  const expectedKey = getPaymentBackendApiKey();
  if (!expectedKey) return true;
  return request.headers.get("x-payment-backend-key") === expectedKey;
}

export async function GET(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const { paymentId } = await params;
    if (!paymentId) {
      return NextResponse.json({ message: "Pagamento não informado." }, { status: 400 });
    }

    const payment = await fetchPixPaymentStatusDirect(paymentId);
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao consultar pagamento." }, { status: 400 });
  }
}
