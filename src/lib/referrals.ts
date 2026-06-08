import { Prisma, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/seo";
import { getWalletAvailableBalance } from "@/lib/utils";

export const REFERRAL_COOKIE_NAME = "lucky_referral";
const REFERRAL_BONUS_AMOUNT = new Prisma.Decimal(5);

export function normalizeInviteCode(value?: string | null) {
  return value?.trim() || null;
}

export function getReferralLink(inviteCode: string) {
  const baseUrl = getSiteUrl();
  return `${baseUrl}/convite/${inviteCode}`;
}

export function splitWalletDebit(input: {
  balance: Prisma.Decimal | number | string;
  bonusBalance: Prisma.Decimal | number | string;
  amount: Prisma.Decimal | number | string;
}) {
  const amount = new Prisma.Decimal(input.amount);
  const bonusBalance = new Prisma.Decimal(input.bonusBalance);
  const balance = new Prisma.Decimal(input.balance);
  const bonusUsed = bonusBalance.lessThan(amount) ? bonusBalance : amount;
  const cashUsed = amount.minus(bonusUsed);

  return {
    amount,
    bonusUsed,
    cashUsed,
    nextBonusBalance: bonusBalance.minus(bonusUsed),
    nextBalance: balance.minus(cashUsed),
  };
}

export async function applyReferralBonusForFirstPaidPurchase(input: {
  userId: string;
  purchaseId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      include: {
        referredBy: {
          include: { wallet: true },
        },
      },
    });

    if (!user?.referredBy || user.referralRewardedAt) {
      return null;
    }

    const paidPurchasesCount = await tx.purchase.count({
      where: {
        userId: input.userId,
        status: "PAID",
      },
    });

    if (paidPurchasesCount !== 1) {
      return null;
    }

    const inviterWallet = user.referredBy.wallet;
    if (!inviterWallet) {
      return null;
    }

    const balanceBefore = new Prisma.Decimal(getWalletAvailableBalance(inviterWallet));

    const updatedWallet = await tx.wallet.update({
      where: { id: inviterWallet.id },
      data: {
        bonusBalance: {
          increment: REFERRAL_BONUS_AMOUNT,
        },
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        referralRewardedAt: new Date(),
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: inviterWallet.id,
        userId: user.referredBy.id,
        type: WalletTransactionType.REFERRAL_BONUS,
        status: WalletTransactionStatus.COMPLETED,
        amount: REFERRAL_BONUS_AMOUNT,
        balanceBefore,
        balanceAfter: new Prisma.Decimal(getWalletAvailableBalance(updatedWallet)),
        description: `Bônus de indicação recebido pela primeira compra de ${user.name}`,
        referenceType: "referral",
        referenceId: user.id,
        metadata: {
          purchaseId: input.purchaseId,
          inviteCode: user.referredBy.inviteCode,
          rewardedUserId: user.id,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: user.referredBy.id,
        type: "SUCCESS",
        title: "Bônus de indicação liberado",
        message: `${user.name} fez a primeira compra e você ganhou R$ 5,00 para usar em novas cotas.`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        userId: user.referredBy.id,
        action: "CREDIT_ADDED",
        entityType: "referral_bonus",
        entityId: user.id,
        newData: {
          amount: REFERRAL_BONUS_AMOUNT.toString(),
          purchaseId: input.purchaseId,
          rewardedUserId: user.id,
        },
      },
    });

    return updatedWallet;
  });
}
