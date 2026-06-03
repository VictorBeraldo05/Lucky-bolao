import { NextResponse } from "next/server";
import { Prisma, PaymentStatus, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletAvailableBalance } from "@/lib/utils";
import { manualCreditSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  }

  try {
    const payload = manualCreditSchema.parse(await request.json());
    const meta = await getRequestMeta();

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: payload.userId } });
      if (!wallet) throw new Error("Carteira nao encontrada.");

      const amount = new Prisma.Decimal(payload.amount);
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      const payment = await tx.payment.create({
        data: {
          userId: payload.userId,
          amount,
          status: PaymentStatus.APPROVED,
          method: "manual",
          reference: `admin-${Date.now()}`,
          metadata: { approvedBy: admin.id },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: payload.userId,
          type: WalletTransactionType.MANUAL_CREDIT,
          status: WalletTransactionStatus.COMPLETED,
          amount,
          balanceBefore: new Prisma.Decimal(getWalletAvailableBalance(wallet)),
          balanceAfter: new Prisma.Decimal(getWalletAvailableBalance(updatedWallet)),
          description: payload.description,
          referenceType: "payment",
          referenceId: payment.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: payload.userId,
          type: "SUCCESS",
          title: "Credito aprovado",
          message: `Foi adicionado ${payload.amount.toFixed(2)} em sua carteira.`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          userId: payload.userId,
          action: "CREDIT_ADDED",
          entityType: "wallet",
          entityId: wallet.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          newData: { amount: payload.amount, paymentId: payment.id },
        },
      });
    });

    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/pagamentos");
    return NextResponse.json({ message: "Credito manual realizado com sucesso." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao creditar carteira." }, { status: 400 });
  }
}
