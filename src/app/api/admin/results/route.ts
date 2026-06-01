import { NextResponse } from "next/server";
import { Prisma, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateHits, resolvePoolPrizeAmount } from "@/lib/lottery";
import { getCurrentUser, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resultSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  }

  try {
    const payload = resultSchema.parse(await request.json());
    const meta = await getRequestMeta();

    await prisma.$transaction(async (tx) => {
      const contest = await tx.contest.findUnique({
        where: { id: payload.contestId },
        include: {
          pools: {
            include: {
              games: true,
              shares: {
                include: {
                  user: { include: { wallet: true } },
                },
              },
            },
          },
          lottery: true,
        },
      });

      if (!contest) throw new Error("Concurso não encontrado.");

      await tx.contestResult.upsert({
        where: { contestId: contest.id },
        update: {
          drawnNumbers: payload.drawnNumbers,
          prizeBreakdown: payload.prizeBreakdown,
          source: payload.source,
        },
        create: {
          contestId: contest.id,
          drawnNumbers: payload.drawnNumbers,
          prizeBreakdown: payload.prizeBreakdown,
          source: payload.source,
        },
      });

      await tx.contest.update({
        where: { id: contest.id },
        data: { status: "finished" },
      });

      for (const pool of contest.pools) {
        const hitsByGame = pool.games.map((game) => calculateHits(game.numbers, payload.drawnNumbers));

        for (let index = 0; index < pool.games.length; index += 1) {
          await tx.poolGame.update({
            where: { id: pool.games[index].id },
            data: {
              hits: hitsByGame[index],
              prizeAmount: new Prisma.Decimal(payload.prizeBreakdown[String(hitsByGame[index])] ?? 0),
            },
          });
        }

        const totalPrize = resolvePoolPrizeAmount(payload.prizeBreakdown, hitsByGame);
        const soldShares = pool.shares.reduce((sum, share) => sum + share.quantity, 0);

        await tx.pool.update({
          where: { id: pool.id },
          data: {
            status: totalPrize > 0 ? "AWARDED" : "NOT_AWARDED",
          },
        });

        if (totalPrize > 0 && soldShares > 0) {
          const sharesByUser = new Map<string, { quantity: number; shareIds: string[] }>();

          for (const share of pool.shares) {
            const current = sharesByUser.get(share.userId) ?? { quantity: 0, shareIds: [] };
            current.quantity += share.quantity;
            current.shareIds.push(share.id);
            sharesByUser.set(share.userId, current);
          }

          for (const [userId, groupedShare] of sharesByUser.entries()) {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet) continue;

            const proportionalAmount = new Prisma.Decimal(totalPrize)
              .mul(groupedShare.quantity)
              .div(soldShares)
              .toDecimalPlaces(2);

            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: { increment: proportionalAmount } },
            });

            await tx.prize.create({
              data: {
                userId,
                poolId: pool.id,
                poolShareId: groupedShare.shareIds[0],
                amount: proportionalAmount,
                hitCount: Math.max(...hitsByGame),
                description: `Prêmio proporcional do bolão ${pool.code}`,
              },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                userId,
                type: WalletTransactionType.PRIZE_CREDIT,
                status: WalletTransactionStatus.COMPLETED,
                amount: proportionalAmount,
                balanceBefore: wallet.balance,
                balanceAfter: updatedWallet.balance,
                description: `Crédito de prêmio do bolão ${pool.code}`,
                referenceType: "pool",
                referenceId: pool.id,
              },
            });

            await tx.notification.create({
              data: {
                userId,
                type: "SUCCESS",
                title: "Prêmio creditado",
                message: `Seu prêmio do bolão ${pool.code} foi creditado na carteira.`,
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            actorUserId: admin.id,
            action: totalPrize > 0 ? "PRIZE_DISTRIBUTED" : "RESULT_PUBLISHED",
            entityType: "contest",
            entityId: contest.id,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            newData: {
              poolId: pool.id,
              totalPrize,
              hitsByGame,
              drawnNumbers: payload.drawnNumbers,
            },
          },
        });
      }
    });

    revalidatePath("/resultados");
    revalidatePath("/admin/resultados");
    revalidatePath("/admin/premios");
    revalidatePath("/meus-jogos");
    revalidatePath("/carteira");
    revalidatePath("/resgates");

    return NextResponse.json({ message: "Resultado publicado e premiação processada." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Falha ao publicar resultado." }, { status: 400 });
  }
}
