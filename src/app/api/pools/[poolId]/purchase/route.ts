import { NextResponse } from "next/server";
import { Prisma, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ poolId: string }> }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.wallet) {
      return NextResponse.json({ message: "Voce precisa estar logado para comprar cotas." }, { status: 401 });
    }

    const { poolId } = await params;
    const parsed = purchaseSchema.parse({
      poolId,
      ...(await request.json()),
    });

    const meta = await getRequestMeta();

    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({
        where: { id: parsed.poolId },
        include: { contest: true },
      });

      if (!pool) throw new Error("Bolao nao encontrado.");
      if (pool.status !== "OPEN") throw new Error("Este bolao nao esta disponivel para compra.");

      const total = new Prisma.Decimal(pool.sharePrice).mul(parsed.quantity);
      const wallet = await tx.wallet.findUnique({ where: { userId: currentUser.id } });
      if (!wallet) throw new Error("Carteira nao encontrada.");
      if (wallet.balance.lessThan(total)) throw new Error("Saldo insuficiente.");

      const walletUpdateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: total },
        },
        data: { balance: { decrement: total } },
      });

      if (walletUpdateResult.count === 0) throw new Error("Saldo insuficiente.");

      const poolUpdateResult = await tx.pool.updateMany({
        where: {
          id: pool.id,
          status: "OPEN",
          availableShares: { gte: parsed.quantity },
        },
        data: {
          availableShares: { decrement: parsed.quantity },
        },
      });

      if (poolUpdateResult.count === 0) throw new Error("Nao ha cotas suficientes disponiveis.");

      const [updatedWallet, updatedPool] = await Promise.all([
        tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } }),
        tx.pool.findUniqueOrThrow({ where: { id: pool.id } }),
      ]);

      if (updatedPool.availableShares === 0 && updatedPool.status !== "SOLD_OUT") {
        await tx.pool.update({
          where: { id: updatedPool.id },
          data: { status: "SOLD_OUT" },
        });
      }

      const purchase = await tx.purchase.create({
        data: {
          userId: currentUser.id,
          status: "PAID",
          totalAmount: total,
          items: {
            create: {
              poolId: pool.id,
              quantity: parsed.quantity,
              unitPrice: pool.sharePrice,
              totalPrice: total,
            },
          },
        },
        include: { items: true },
      });

      await tx.poolShare.create({
        data: {
          poolId: pool.id,
          userId: currentUser.id,
          purchaseItemId: purchase.items[0].id,
          quantity: parsed.quantity,
          unitPrice: pool.sharePrice,
          totalPrice: total,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: currentUser.id,
          type: WalletTransactionType.SHARE_PURCHASE,
          status: WalletTransactionStatus.COMPLETED,
          amount: total.negated(),
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          description: `Compra de ${parsed.quantity} cota(s) no bolao ${pool.code}`,
          referenceType: "purchase",
          referenceId: purchase.id,
          metadata: { poolCode: pool.code, quantity: parsed.quantity },
        },
      });

      await tx.notification.create({
        data: {
          userId: currentUser.id,
          type: "SUCCESS",
          title: "Compra confirmada",
          message: `Voce comprou ${parsed.quantity} cota(s) do bolao ${pool.code}.`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: currentUser.id,
          userId: currentUser.id,
          action: "SHARE_PURCHASED",
          entityType: "purchase",
          entityId: purchase.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          newData: {
            poolId: pool.id,
            quantity: parsed.quantity,
            total: total.toString(),
            availableSharesAfter: updatedPool.availableShares,
          },
        },
      });

      return purchase;
    });

    const poolCode = await prisma.pool.findUnique({
      where: { id: result.items[0].poolId },
      select: { code: true },
    });

    revalidatePath(`/boloes/${poolCode?.code ?? ""}`);
    revalidatePath("/");
    revalidatePath("/loterias/lotofacil/boloes");
    revalidatePath("/meus-jogos");
    revalidatePath("/minha-conta");
    revalidatePath("/carteira");
    revalidatePath("/extrato");

    return NextResponse.json({ message: "Compra realizada com sucesso.", purchaseId: result.id });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Nao foi possivel concluir a compra." }, { status: 400 });
  }
}
