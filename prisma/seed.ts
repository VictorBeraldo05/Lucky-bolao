import { PrismaClient, Prisma, UserRole, PoolStatus, WalletTransactionStatus, WalletTransactionType, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@luckyboloes.com" },
    update: {},
    create: {
      name: "Admin Lucky",
      email: "admin@luckyboloes.com",
      passwordHash,
      role: UserRole.ADMIN,
      wallet: { create: { balance: new Prisma.Decimal(5000) } },
    },
    include: { wallet: true },
  });

  const user = await prisma.user.upsert({
    where: { email: "cliente@luckyboloes.com" },
    update: {},
    create: {
      name: "Cliente Demo",
      email: "cliente@luckyboloes.com",
      passwordHash,
      wallet: { create: { balance: new Prisma.Decimal(250) } },
    },
    include: { wallet: true },
  });

  const lottery = await prisma.lottery.upsert({
    where: { slug: "lotofacil" },
    update: {},
    create: {
      slug: "lotofacil",
      name: "Lotofacil",
      description: "Bolões digitais para a Lotofacil com compra de cotas e acompanhamento completo.",
      minNumbers: 15,
      maxNumbers: 20,
      numberStart: 1,
      numberEnd: 25,
      drawDays: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
      basePrice: new Prisma.Decimal(3),
      accentColor: "#b833d1",
    },
  });

  const simpleType = await prisma.lotteryGameType.upsert({
    where: {
      lotteryId_slug: {
        lotteryId: lottery.id,
        slug: "simples",
      },
    },
    update: {},
    create: {
      lotteryId: lottery.id,
      name: "Bolao Simples",
      slug: "simples",
      description: "Uma ou mais apostas tradicionais com 15 dezenas.",
      minNumbers: 15,
      maxNumbers: 15,
      strategy: "simple",
    },
  });

  const advancedType = await prisma.lotteryGameType.upsert({
    where: {
      lotteryId_slug: {
        lotteryId: lottery.id,
        slug: "avancado",
      },
    },
    update: {},
    create: {
      lotteryId: lottery.id,
      name: "Bolao Avancado",
      slug: "avancado",
      description: "Fechamentos e desdobramentos com mais dezenas.",
      minNumbers: 16,
      maxNumbers: 20,
      strategy: "advanced",
      config: {
        supportsClosing: true,
      },
    },
  });

  const contestA = await prisma.contest.upsert({
    where: { lotteryId_contestNumber: { lotteryId: lottery.id, contestNumber: 3100 } },
    update: {},
    create: {
      lotteryId: lottery.id,
      contestNumber: 3100,
      drawDate: addDays(new Date(), 2),
      status: "scheduled",
    },
  });

  const contestB = await prisma.contest.upsert({
    where: { lotteryId_contestNumber: { lotteryId: lottery.id, contestNumber: 3101 } },
    update: {},
    create: {
      lotteryId: lottery.id,
      contestNumber: 3101,
      drawDate: addDays(new Date(), 4),
      status: "scheduled",
    },
  });

  const poolSimple = await prisma.pool.upsert({
    where: { code: "LF-3100-SIM-01" },
    update: {},
    create: {
      code: "LF-3100-SIM-01",
      lotteryId: lottery.id,
      gameTypeId: simpleType.id,
      contestId: contestA.id,
      title: "Lotofacil 3100 Simples Premium",
      description: "Bolao com 4 jogos simples, excelente equilibrio entre custo e cobertura.",
      totalValue: new Prisma.Decimal(120),
      sharePrice: new Prisma.Decimal(12),
      totalShares: 10,
      availableShares: 7,
      relativeChance: "4x a aposta simples",
      ticketImageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: [
          { title: "Jogo 1", numbers: [1, 2, 3, 5, 6, 8, 9, 11, 12, 13, 15, 18, 20, 22, 24] },
          { title: "Jogo 2", numbers: [2, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17, 19, 21, 23, 25] },
          { title: "Jogo 3", numbers: [1, 3, 4, 6, 7, 9, 10, 12, 13, 16, 18, 19, 22, 24, 25] },
          { title: "Jogo 4", numbers: [2, 3, 5, 6, 8, 9, 11, 14, 15, 16, 18, 20, 21, 23, 24] },
        ],
      },
    },
  });

  await prisma.pool.upsert({
    where: { code: "LF-3101-ADV-01" },
    update: {},
    create: {
      code: "LF-3101-ADV-01",
      lotteryId: lottery.id,
      gameTypeId: advancedType.id,
      contestId: contestB.id,
      title: "Lotofacil 3101 Fechamento 18 dezenas",
      description: "Desdobramento inteligente com cobertura ampliada para 18 dezenas.",
      totalValue: new Prisma.Decimal(300),
      sharePrice: new Prisma.Decimal(25),
      totalShares: 12,
      availableShares: 12,
      relativeChance: "cobertura elevada com fechamento",
      ticketImageUrl: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: [
          { title: "Fechamento A", numbers: [1, 2, 3, 4, 6, 7, 9, 10, 12, 13, 14, 17, 18, 20, 22, 23, 24, 25] },
          { title: "Fechamento B", numbers: [2, 3, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17, 19, 20, 21, 22, 24, 25] },
        ],
      },
    },
  });

  const existingShare = await prisma.poolShare.findFirst({
    where: { poolId: poolSimple.id, userId: user.id },
  });

  if (!existingShare && user.wallet) {
    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        totalAmount: new Prisma.Decimal(36),
        status: "PAID",
        items: {
          create: {
            poolId: poolSimple.id,
            quantity: 3,
            unitPrice: new Prisma.Decimal(12),
            totalPrice: new Prisma.Decimal(36),
          },
        },
      },
      include: { items: true },
    });

    await prisma.poolShare.create({
      data: {
        poolId: poolSimple.id,
        userId: user.id,
        purchaseItemId: purchase.items[0].id,
        quantity: 3,
        unitPrice: new Prisma.Decimal(12),
        totalPrice: new Prisma.Decimal(36),
      },
    });

    await prisma.pool.update({
      where: { id: poolSimple.id },
      data: { availableShares: { decrement: 3 } },
    });

    await prisma.wallet.update({
      where: { id: user.wallet.id },
      data: { balance: { decrement: new Prisma.Decimal(36) } },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        userId: user.id,
        type: WalletTransactionType.SHARE_PURCHASE,
        status: WalletTransactionStatus.COMPLETED,
        amount: new Prisma.Decimal(-36),
        balanceBefore: new Prisma.Decimal(250),
        balanceAfter: new Prisma.Decimal(214),
        description: "Compra inicial de 3 cotas do bolao LF-3100-SIM-01",
        referenceType: "purchase",
        referenceId: purchase.id,
      },
    });
  }

  const existingCredit = await prisma.payment.findFirst({
    where: { userId: user.id, reference: "seed-credit-1" },
  });

  if (!existingCredit && user.wallet) {
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: new Prisma.Decimal(250),
        status: PaymentStatus.APPROVED,
        method: "manual",
        reference: "seed-credit-1",
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        userId: user.id,
        type: WalletTransactionType.MANUAL_CREDIT,
        status: WalletTransactionStatus.COMPLETED,
        amount: new Prisma.Decimal(250),
        balanceBefore: new Prisma.Decimal(0),
        balanceAfter: new Prisma.Decimal(250),
        description: "Credito inicial seed",
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "SUCCESS",
        title: "Conta pronta",
        message: "Sua conta demo foi criada com saldo inicial para testar compras.",
      },
      {
        userId: admin.id,
        type: "INFO",
        title: "Ambiente seedado",
        message: "O ambiente inicial foi preparado com concursos e boloes da Lotofacil.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        userId: admin.id,
        action: "ADMIN_ACTION",
        entityType: "seed",
        entityId: `seed-${addHours(new Date(), 0).toISOString()}`,
        newData: { lotteries: 1, contests: 2, pools: 2 },
      },
      {
        actorUserId: user.id,
        userId: user.id,
        action: "REGISTER",
        entityType: "user",
        entityId: user.id,
        newData: { email: user.email },
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
