import { NextResponse } from "next/server";
import { createPixPaymentDirect, getPaymentBackendApiKey } from "@/lib/mercadopago";
import { pixPaymentSchema } from "@/lib/validations";

function isAuthorized(request: Request) {
  const expectedKey = getPaymentBackendApiKey();
  if (!expectedKey) return true;
  return request.headers.get("x-payment-backend-key") === expectedKey;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const payload = pixPaymentSchema.parse(await request.json());
    const payment = await createPixPaymentDirect(payload);
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao criar pagamento." }, { status: 400 });
  }
}
