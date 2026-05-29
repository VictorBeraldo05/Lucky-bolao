import { Prisma, PaymentStatus, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchPixPaymentStatus, determineTopupStatus, parsePaymentTopupData } from "@/lib/mercadopago";

export async function syncWalletTopup(topupId: string, correlationId?: string) {
  const topup = await prisma.walletTopup.findUnique({ where: { id: topupId } });
  if (!topup) {
    throw new Error("Topup nao encontrado.");
  }
  if (!topup.providerChargeId) {
    throw new Error("Topup sem providerChargeId.");
  }

  const payment = await fetchPixPaymentStatus(topup.providerChargeId);
  const status = determineTopupStatus(payment, topup.payerCpfExpected);
  const paymentData = parsePaymentTopupData(payment);

  return await prisma.$transaction(async (tx) => {
    const updatedTopup = await tx.walletTopup.update({
      where: { id: topup.id },
      data: {
        status,
        correlationId: correlationId ?? topup.correlationId,
        qrCodeText: paymentData.qrCodeText,
        qrCodeImageBase64: paymentData.qrCodeImageBase64,
        paymentLinkUrl: paymentData.paymentLinkUrl,
        expiresAt: paymentData.expiresAt ? new Date(paymentData.expiresAt) : undefined,
        providerPayload: payment,
      },
      include: { user: true },
    });

    if (status === "PAID" && topup.status !== "PAID") {
      const wallet = await tx.wallet.findUnique({ where: { userId: updatedTopup.userId } });
      if (!wallet) throw new Error("Carteira nao encontrada.");

      const amount = new Prisma.Decimal(payment.transaction_amount ?? 0);
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      const paymentRecord = await tx.payment.create({
        data: {
          userId: updatedTopup.userId,
          amount,
          status: PaymentStatus.APPROVED,
          method: "pix",
          reference: updatedTopup.providerChargeId,
          metadata: { topupId: updatedTopup.id },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: updatedTopup.userId,
          type: WalletTransactionType.CREDIT_PURCHASE,
          status: WalletTransactionStatus.COMPLETED,
          amount,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          description: "PIX topup",
          referenceType: "payment",
          referenceId: paymentRecord.id,
          metadata: { topupId: updatedTopup.id },
        },
      });
    }

    return updatedTopup;
  });
}

export async function syncPendingWalletTopupsForUser(userId: string) {
  const pendingTopups = await prisma.walletTopup.findMany({
    where: { userId, status: "PENDING", providerChargeId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const topup of pendingTopups) {
    try {
      await syncWalletTopup(topup.id);
    } catch {
      // ignore failures here so page still renders
    }
  }
}
