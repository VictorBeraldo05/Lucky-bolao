import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { checkoutCartWithWalletBalance } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { createPixPayment, parsePaymentTopupData, determineTopupStatus } from "@/lib/mercadopago";

function mapToPaymentStatus(status: string) {
  if (status === "PAID") return "APPROVED";
  if (status === "PENDING") return "PENDING";
  if (status === "MANUAL_REVIEW") return "PENDING";
  return "CANCELED";
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { method?: string } | null;
  const method = payload?.method === "wallet" ? "wallet" : "pix";

  if (method === "pix" && !currentUser.cpf) {
    return NextResponse.json({ message: "CPF necessario para finalizar o pagamento." }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: currentUser.id },
    include: { items: { include: { pool: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ message: "Carrinho vazio." }, { status: 400 });
  }

  const invalidPool = cart.items.find((item) => item.pool.status !== "OPEN" || item.pool.availableShares < item.quantity);
  if (invalidPool) {
    return NextResponse.json({ message: "Um dos boloes no carrinho nao esta mais disponivel." }, { status: 400 });
  }

  const amount = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  try {
    if (method === "wallet") {
      const result = await checkoutCartWithWalletBalance(currentUser.id);

      revalidatePath("/");
      revalidatePath("/loterias/lotofacil/boloes");
      revalidatePath("/carrinho");
      revalidatePath("/meus-jogos");
      revalidatePath("/minha-conta");
      revalidatePath("/carteira");
      revalidatePath("/extrato");

      return NextResponse.json({
        payment: result.payment,
        approved: true,
        message: "Compra concluida com o saldo da conta.",
      });
    }

    const payment = await createPixPayment({
      email: currentUser.email,
      name: currentUser.name,
      cpf: currentUser.cpf!,
      title: `Compra de carrinho ${cart.id}`,
      amount,
      referenceId: `cart-${cart.id}`,
    });

    const paymentData = parsePaymentTopupData(payment);
    const status = determineTopupStatus(payment, currentUser.cpf);
    const paymentStatus = mapToPaymentStatus(status);

    const paymentRecord = await prisma.payment.create({
      data: {
        userId: currentUser.id,
        amount: amount,
        status: paymentStatus,
        method: "pix",
        reference: String(payment.id),
        metadata: {
          cartId: cart.id,
          items: cart.items.map((item) => ({ poolId: item.poolId, quantity: item.quantity, totalPrice: item.totalPrice })),
          providerPayload: payment,
          qrCodeImageBase64: paymentData.qrCodeImageBase64,
          qrCodeText: paymentData.qrCodeText,
          paymentLinkUrl: paymentData.paymentLinkUrl,
          expiresAt: paymentData.expiresAt,
        },
      },
    });

    return NextResponse.json({ payment: paymentRecord, paymentData });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao criar pagamento." }, { status: 400 });
  }
}
