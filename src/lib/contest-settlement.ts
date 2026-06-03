import { Prisma, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { calculateHits, resolvePoolPrizeAmount } from "@/lib/lottery";
import { prisma } from "@/lib/prisma";
import { getWalletAvailableBalance } from "@/lib/utils";

type PublishContestResultInput = {
  contestId: string;
  drawnNumbers: number[];
  prizeBreakdown: Record<string, number>;
  source?: string;
  actorUserId?: string | null;
  meta?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export async function publishContestResult(input: PublishContestResultInput) {
  return prisma.$transaction(async (tx) => {
    const contest = await tx.contest.findUnique({
      where: { id: input.contestId },
      include: {
        result: true,
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

    if (!contest) {
      throw new Error("Concurso não encontrado.");
    }

    if (contest.result && contest.status === "finished") {
      const sameNumbers = JSON.stringify(contest.result.drawnNumbers) === JSON.stringify(input.drawnNumbers);
      const sameBreakdown = JSON.stringify(contest.result.prizeBreakdown ?? {}) === JSON.stringify(input.prizeBreakdown);

      if (sameNumbers && sameBreakdown) {
        return {
          alreadyProcessed: true,
          contestId: contest.id,
          contestNumber: contest.contestNumber,
          processedPools: 0,
        };
      }

      throw new Error(`O concurso #${contest.contestNumber} já foi processado e não pode ser reapurado automaticamente.`);
    }

    await tx.contestResult.upsert({
      where: { contestId: contest.id },
      update: {
        drawnNumbers: input.drawnNumbers,
        prizeBreakdown: input.prizeBreakdown,
        source: input.source,
      },
      create: {
        contestId: contest.id,
        drawnNumbers: input.drawnNumbers,
        prizeBreakdown: input.prizeBreakdown,
        source: input.source,
      },
    });

    await tx.contest.update({
      where: { id: contest.id },
      data: { status: "finished" },
    });

    let processedPools = 0;

    for (const pool of contest.pools) {
      const existingPrize = await tx.prize.findFirst({
        where: { poolId: pool.id },
        select: { id: true },
      });

      if (existingPrize) {
        throw new Error(`O bolão ${pool.code} já possui premiação registrada para esse concurso.`);
      }

      const hitsByGame = pool.games.map((game) => calculateHits(game.numbers, input.drawnNumbers));

      for (let index = 0; index < pool.games.length; index += 1) {
        await tx.poolGame.update({
          where: { id: pool.games[index].id },
          data: {
            hits: hitsByGame[index],
            prizeAmount: new Prisma.Decimal(input.prizeBreakdown[String(hitsByGame[index])] ?? 0),
          },
        });
      }

      const totalPrize = resolvePoolPrizeAmount(input.prizeBreakdown, hitsByGame);
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
              balanceBefore: new Prisma.Decimal(getWalletAvailableBalance(wallet)),
              balanceAfter: new Prisma.Decimal(getWalletAvailableBalance(updatedWallet)),
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
          actorUserId: input.actorUserId ?? null,
          action: totalPrize > 0 ? "PRIZE_DISTRIBUTED" : "RESULT_PUBLISHED",
          entityType: "contest",
          entityId: contest.id,
          ipAddress: input.meta?.ipAddress ?? null,
          userAgent: input.meta?.userAgent ?? null,
          newData: {
            poolId: pool.id,
            totalPrize,
            hitsByGame,
            drawnNumbers: input.drawnNumbers,
            source: input.source ?? null,
          },
        },
      });

      processedPools += 1;
    }

    return {
      alreadyProcessed: false,
      contestId: contest.id,
      contestNumber: contest.contestNumber,
      processedPools,
    };
  });
}
