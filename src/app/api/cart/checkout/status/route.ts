import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { syncPendingCartPaymentsForUser } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const currentUser = await getCurrentUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  await syncPendingCartPaymentsForUser(currentUser.id);

  const { searchParams } = new URL(request.url);
  const requestedPaymentId = searchParams.get("paymentId");

  const payments = await prisma.payment.findMany({
    where: { userId: currentUser.id, method: "pix" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const latestCartPayment = payments.find((payment) => {
    const metadata = (payment.metadata as { cartId?: string } | null) ?? {};
    if (!metadata.cartId) return false;
    if (!requestedPaymentId) return true;
    return payment.id === requestedPaymentId;
  });

  const paymentMetadata =
    latestCartPayment?.metadata && typeof latestCartPayment.metadata === "object"
      ? (latestCartPayment.metadata as {
          qrCodeText?: string | null;
          qrCodeImageBase64?: string | null;
          paymentLinkUrl?: string | null;
          expiresAt?: string | null;
        })
      : null;

  return NextResponse.json({
    payment: latestCartPayment ?? null,
    paymentData: latestCartPayment
      ? {
          qrCodeText: paymentMetadata?.qrCodeText ?? null,
          qrCodeImageBase64: paymentMetadata?.qrCodeImageBase64 ?? null,
          paymentLinkUrl: paymentMetadata?.paymentLinkUrl ?? null,
          expiresAt: paymentMetadata?.expiresAt ?? null,
        }
      : null,
  });
}
