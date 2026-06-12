import { Prisma, PaymentStatus, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { determineTopupStatus, fetchPixPaymentStatus, parsePaymentTopupData } from "@/lib/mercadopago";
import { getWalletAvailableBalance } from "@/lib/utils";

type WithdrawalRequestInput = {
  pixKeyType: "CPF" | "EMAIL" | "PHONE" | "RANDOM";
  pixKey: string;
  amount: number;
};

type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

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
          balanceBefore: new Prisma.Decimal(getWalletAvailableBalance(wallet)),
          balanceAfter: new Prisma.Decimal(getWalletAvailableBalance(updatedWallet)),
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

export async function requestWalletWithdrawal(userId: string, input: WithdrawalRequestInput, meta?: RequestMeta) {
  const amount = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error("Carteira nao encontrada.");
    }

    const withdrawableBalance = Number(wallet.balance);
    if (withdrawableBalance < input.amount) {
      throw new Error("Saldo disponivel insuficiente para saque.");
    }

    const balanceBefore = new Prisma.Decimal(getWalletAvailableBalance(wallet));
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });
    const balanceAfter = new Prisma.Decimal(getWalletAvailableBalance(updatedWallet));

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: WalletTransactionType.WITHDRAWAL,
        status: WalletTransactionStatus.PENDING,
        amount: amount.negated(),
        balanceBefore,
        balanceAfter,
        description: "Solicitacao de saque via PIX",
        referenceType: "withdrawal_request",
        metadata: {
          pixKeyType: input.pixKeyType,
          pixKey: input.pixKey,
          estimatedCompletionWindow: "24h",
        },
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: "INFO",
        title: "Saque solicitado",
        message: "Recebemos sua solicitacao de saque via PIX. O processamento pode levar ate 24h.",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        userId,
        action: "STATUS_CHANGED",
        entityType: "wallet_withdrawal_request",
        entityId: transaction.id,
        newData: {
          amount: input.amount,
          pixKeyType: input.pixKeyType,
          pixKey: input.pixKey,
          status: "PENDING",
        },
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });

    return transaction;
  });
}
