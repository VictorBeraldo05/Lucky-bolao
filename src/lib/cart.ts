import { Prisma, PaymentStatus, PurchaseStatus, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { fetchPixPaymentStatus, determineTopupStatus } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

function mapToPaymentStatus(status: string) {
  if (status === "PAID") return PaymentStatus.APPROVED;
  if (status === "PENDING") return PaymentStatus.PENDING;
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

export async function finalizeApprovedCartPayment(paymentId: string, correlationId?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { include: { wallet: true } } },
  });

  if (!payment) {
    throw new Error("Pagamento nao encontrado.");
  }

  const metadata = ((payment.metadata as PaymentMetadata | null) ?? {});
  if (!metadata.cartId) {
    return payment;
  }

  if (metadata.purchaseId) {
    return payment;
  }

  return prisma.$transaction(async (tx) => {
    const lockedPayment = await tx.payment.findUnique({ where: { id: payment.id } });
    const lockedMetadata = ((lockedPayment?.metadata as PaymentMetadata | null) ?? {});
    if (!lockedPayment) throw new Error("Pagamento nao encontrado.");
    if (lockedMetadata.purchaseId) return lockedPayment;
    if (lockedPayment.status !== PaymentStatus.APPROVED) return lockedPayment;

    const cart = await tx.cart.findUnique({
      where: { id: lockedMetadata.cartId },
      include: { items: { include: { pool: true } } },
    });

    if (!cart) {
      throw new Error("Carrinho nao encontrado.");
    }

    if (cart.items.length === 0) {
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          metadata: toJsonMetadata({
            ...lockedMetadata,
            fulfilledAt: new Date().toISOString(),
          }),
        },
      });
    }

    const purchase = await tx.purchase.create({
      data: {
        userId: payment.userId,
        status: PurchaseStatus.PAID,
        totalAmount: payment.amount,
      },
    });

    for (const item of cart.items) {
      const pool = await tx.pool.findUnique({ where: { id: item.poolId } });
      if (!pool) throw new Error("Bolao nao encontrado para concluir pagamento.");
      if (pool.status !== "OPEN" && pool.status !== "SOLD_OUT") {
        throw new Error("Bolao indisponivel para concluir pagamento.");
      }

      const poolUpdate = await tx.pool.updateMany({
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

      const purchaseItem = await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          poolId: item.poolId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });

      await tx.poolShare.create({
        data: {
          poolId: item.poolId,
          userId: payment.userId,
          purchaseItemId: purchaseItem.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });

      const refreshedPool = await tx.pool.findUniqueOrThrow({ where: { id: pool.id } });
      if (refreshedPool.availableShares === 0 && refreshedPool.status !== "SOLD_OUT") {
        await tx.pool.update({
          where: { id: pool.id },
          data: { status: "SOLD_OUT" },
        });
      }
    }

    const wallet = payment.user.wallet;
    if (!wallet) {
      throw new Error("Carteira nao encontrada para concluir a compra.");
    }

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: payment.userId,
        type: WalletTransactionType.SHARE_PURCHASE,
        status: WalletTransactionStatus.COMPLETED,
        amount: new Prisma.Decimal(payment.amount).negated(),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        description: `Compra aprovada via PIX para o carrinho ${cart.id}`,
        referenceType: "purchase",
        referenceId: purchase.id,
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
        entityId: purchase.id,
        newData: {
          paymentId: payment.id,
          cartId: cart.id,
          totalAmount: payment.amount.toString(),
          correlationId: correlationId ?? null,
        },
      },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: {
        status: "CHECKED_OUT",
        items: {
          deleteMany: {},
        },
      },
    });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        metadata: toJsonMetadata({
          ...lockedMetadata,
          purchaseId: purchase.id,
          fulfilledAt: new Date().toISOString(),
        }),
      },
    });

    return updatedPayment;
  });
}

export async function syncPendingCartPaymentsForUser(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { userId, status: PaymentStatus.PENDING, method: "pix" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const payment of payments) {
    const metadata = ((payment.metadata as PaymentMetadata | null) ?? {});
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

  revalidatePath("/carrinho");
  revalidatePath("/meus-jogos");
  revalidatePath("/minha-conta");
  revalidatePath("/carteira");
}
