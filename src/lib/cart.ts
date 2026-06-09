import { Prisma, PaymentStatus, PurchaseStatus, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { fetchPixPaymentStatus, determineTopupStatus } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { applyReferralBonusForFirstPaidPurchase, splitWalletDebit } from "@/lib/referrals";
import { getWalletAvailableBalance } from "@/lib/utils";

function mapToPaymentStatus(status: string) {
  if (status === "PAID") return PaymentStatus.APPROVED;
  if (status === "PENDING") return PaymentStatus.PENDING;
  if (status === "MANUAL_REVIEW") return PaymentStatus.PENDING;
  return PaymentStatus.CANCELED;
}

type PaymentMetadata = {
  cartId?: string;
  purchaseId?: string;
  fulfilledAt?: string;
  items?: Array<{ poolId: string; quantity: number; totalPrice: string }>;
  providerPayload?: unknown;
};

function toJsonMetadata(metadata: PaymentMetadata): Prisma.InputJsonValue {
  return metadata as unknown as Prisma.InputJsonValue;
}

async function fulfillCartPurchaseTx(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  cartId: string;
  amount: Prisma.Decimal;
}) {
  const cart = await input.tx.cart.findUnique({
    where: { id: input.cartId },
    include: { items: true },
  });

  if (!cart) {
    throw new Error("Carrinho nao encontrado.");
  }

  if (cart.items.length === 0) {
    return { purchaseId: null, cartId: cart.id };
  }

  const purchase = await input.tx.purchase.create({
    data: {
      userId: input.userId,
      status: PurchaseStatus.PAID,
      totalAmount: input.amount,
    },
  });

  for (const item of cart.items) {
    const pool = await input.tx.pool.findUnique({ where: { id: item.poolId } });
    if (!pool) throw new Error("Bolao nao encontrado para concluir pagamento.");
    if (pool.status !== "OPEN" && pool.status !== "SOLD_OUT") {
      throw new Error("Bolao indisponivel para concluir pagamento.");
    }

    const poolUpdate = await input.tx.pool.updateMany({
      where: {
        id: pool.id,
        availableShares: { gte: item.quantity },
      },
      data: {
        availableShares: { decrement: item.quantity },
      },
    });

    if (poolUpdate.count === 0) {
      throw new Error(`Nao ha cotas suficientes para concluir o bolao ${pool.code}.`);
    }

    const purchaseItem = await input.tx.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        poolId: item.poolId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      },
    });

    await input.tx.poolShare.create({
      data: {
        poolId: item.poolId,
        userId: input.userId,
        purchaseItemId: purchaseItem.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      },
    });

    const refreshedPool = await input.tx.pool.findUniqueOrThrow({ where: { id: pool.id } });
    if (refreshedPool.availableShares === 0 && refreshedPool.status !== "SOLD_OUT") {
      await input.tx.pool.update({
        where: { id: pool.id },
        data: { status: "SOLD_OUT" },
      });
    }
  }

  await input.tx.cart.update({
    where: { id: cart.id },
    data: {
      status: "CHECKED_OUT",
      items: {
        deleteMany: {},
      },
    },
  });

  return { purchaseId: purchase.id, cartId: cart.id };
}

export async function finalizeApprovedCartPayment(paymentId: string, correlationId?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { include: { wallet: true } } },
  });

  if (!payment) {
    throw new Error("Pagamento nao encontrado.");
  }

  const metadata = (payment.metadata as PaymentMetadata | null) ?? {};
  if (!metadata.cartId || metadata.purchaseId) {
    return payment;
  }

  const transactionResult = await prisma.$transaction(async (tx) => {
    const lockedPayment = await tx.payment.findUnique({ where: { id: payment.id } });
    const lockedMetadata = (lockedPayment?.metadata as PaymentMetadata | null) ?? {};

    if (!lockedPayment) throw new Error("Pagamento nao encontrado.");
    if (lockedMetadata.purchaseId) return { payment: lockedPayment, purchaseId: lockedMetadata.purchaseId ?? null };
    if (lockedPayment.status !== PaymentStatus.APPROVED) return { payment: lockedPayment, purchaseId: null };
    if (!lockedMetadata.cartId) return { payment: lockedPayment, purchaseId: null };

    const cartId = lockedMetadata.cartId;

    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          metadata: toJsonMetadata({
            ...lockedMetadata,
            fulfilledAt: new Date().toISOString(),
          }),
        },
      });

      return { payment: updatedPayment, purchaseId: null };
    }

    const fulfillment = await fulfillCartPurchaseTx({
      tx,
      userId: payment.userId,
      cartId,
      amount: new Prisma.Decimal(payment.amount),
    });

    const wallet = payment.user.wallet;
    if (!wallet) {
      throw new Error("Carteira nao encontrada para concluir a compra.");
    }

    const totalAvailable = new Prisma.Decimal(getWalletAvailableBalance(wallet));

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: payment.userId,
        type: WalletTransactionType.SHARE_PURCHASE,
        status: WalletTransactionStatus.COMPLETED,
        amount: new Prisma.Decimal(payment.amount).negated(),
        balanceBefore: totalAvailable,
        balanceAfter: totalAvailable,
        description: `Compra aprovada via PIX para o carrinho ${fulfillment.cartId}`,
        referenceType: "purchase",
        referenceId: fulfillment.purchaseId,
        metadata: { paymentId: payment.id, correlationId: correlationId ?? null },
      },
    });

    await tx.notification.create({
      data: {
        userId: payment.userId,
        type: "SUCCESS",
        title: "Pagamento aprovado",
        message: "Seu pagamento PIX foi aprovado e suas cotas ja foram reservadas.",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: payment.userId,
        userId: payment.userId,
        action: "SHARE_PURCHASED",
        entityType: "purchase",
        entityId: fulfillment.purchaseId ?? payment.id,
        newData: {
          paymentId: payment.id,
          cartId: fulfillment.cartId,
          totalAmount: payment.amount.toString(),
          correlationId: correlationId ?? null,
        },
      },
    });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        metadata: toJsonMetadata({
          ...lockedMetadata,
          purchaseId: fulfillment.purchaseId ?? undefined,
          fulfilledAt: new Date().toISOString(),
        }),
      },
    });

    return { payment: updatedPayment, purchaseId: fulfillment.purchaseId };
  });

  if (transactionResult.purchaseId) {
    try {
      await applyReferralBonusForFirstPaidPurchase({
        userId: payment.userId,
        purchaseId: transactionResult.purchaseId,
      });
    } catch {
      // ignore referral bonus issues so the approved purchase flow continues
    }
  }

  return transactionResult.payment;
}

export async function checkoutCartWithWalletBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user?.wallet) {
    throw new Error("Carteira nao encontrada.");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { pool: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Carrinho vazio.");
  }

  const invalidPool = cart.items.find((item) => item.pool.status !== "OPEN" || item.pool.availableShares < item.quantity);
  if (invalidPool) {
    throw new Error("Um dos boloes no carrinho nao esta mais disponivel.");
  }

  const amount = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const amountDecimal = new Prisma.Decimal(amount);
  const availableBalance = new Prisma.Decimal(getWalletAvailableBalance(user.wallet));

  if (availableBalance.lessThan(amountDecimal)) {
    throw new Error("Saldo insuficiente para concluir a compra.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error("Carteira nao encontrada.");
    }

    const currentAvailable = new Prisma.Decimal(getWalletAvailableBalance(wallet));
    if (currentAvailable.lessThan(amountDecimal)) {
      throw new Error("Saldo insuficiente para concluir a compra.");
    }

    const debit = splitWalletDebit({
      balance: wallet.balance,
      bonusBalance: wallet.bonusBalance,
      amount: amountDecimal,
    });

    const walletUpdateResult = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        balance: { gte: debit.cashUsed },
        bonusBalance: { gte: debit.bonusUsed },
      },
      data: {
        balance: { decrement: debit.cashUsed },
        bonusBalance: { decrement: debit.bonusUsed },
      },
    });

    if (walletUpdateResult.count === 0) {
      throw new Error("Saldo insuficiente para concluir a compra.");
    }

    const payment = await tx.payment.create({
      data: {
        userId,
        amount: amountDecimal,
        status: PaymentStatus.APPROVED,
        method: "wallet",
        metadata: toJsonMetadata({
          cartId: cart.id,
          items: cart.items.map((item) => ({
            poolId: item.poolId,
            quantity: item.quantity,
            totalPrice: item.totalPrice.toString(),
          })),
        }),
      },
    });

    const fulfillment = await fulfillCartPurchaseTx({
      tx,
      userId,
      cartId: cart.id,
      amount: amountDecimal,
    });

    const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: WalletTransactionType.SHARE_PURCHASE,
        status: WalletTransactionStatus.COMPLETED,
        amount: amountDecimal.negated(),
        balanceBefore: currentAvailable,
        balanceAfter: new Prisma.Decimal(getWalletAvailableBalance(updatedWallet)),
        description: `Compra aprovada com saldo da conta para o carrinho ${cart.id}`,
        referenceType: "purchase",
        referenceId: fulfillment.purchaseId,
        metadata: {
          paymentId: payment.id,
          cartId: cart.id,
          cashUsed: debit.cashUsed.toString(),
          bonusUsed: debit.bonusUsed.toString(),
        },
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: "SUCCESS",
        title: "Compra confirmada",
        message: "Sua compra foi concluida com o saldo da conta e as cotas ja foram reservadas.",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        userId,
        action: "SHARE_PURCHASED",
        entityType: "purchase",
        entityId: fulfillment.purchaseId ?? payment.id,
        newData: {
          paymentId: payment.id,
          cartId: cart.id,
          totalAmount: amountDecimal.toString(),
          cashUsed: debit.cashUsed.toString(),
          bonusUsed: debit.bonusUsed.toString(),
        },
      },
    });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        metadata: toJsonMetadata({
          cartId: cart.id,
          purchaseId: fulfillment.purchaseId ?? undefined,
          fulfilledAt: new Date().toISOString(),
          items: cart.items.map((item) => ({
            poolId: item.poolId,
            quantity: item.quantity,
            totalPrice: item.totalPrice.toString(),
          })),
        }),
      },
    });

    return {
      payment: updatedPayment,
      purchaseId: fulfillment.purchaseId,
    };
  });

  if (result.purchaseId) {
    try {
      await applyReferralBonusForFirstPaidPurchase({
        userId,
        purchaseId: result.purchaseId,
      });
    } catch {
      // ignore referral bonus issues so the confirmed purchase flow continues
    }
  }

  return result;
}

export async function syncPendingCartPaymentsForUser(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { userId, status: PaymentStatus.PENDING, method: "pix" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const payment of payments) {
    const metadata = (payment.metadata as PaymentMetadata | null) ?? {};
    if (!metadata.cartId || !payment.reference) continue;

    try {
      const providerPayment = await fetchPixPaymentStatus(payment.reference);
      const status = determineTopupStatus(providerPayment);
      const paymentStatus = mapToPaymentStatus(status);

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          metadata: toJsonMetadata({
            ...metadata,
            providerPayload: providerPayment,
          }),
        },
      });

      if (paymentStatus === PaymentStatus.APPROVED) {
        await finalizeApprovedCartPayment(updatedPayment.id);
      }
    } catch {
      // ignore sync failures on page load
    }
  }
}
