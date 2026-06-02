import { PrismaClient, Prisma, UserRole, PoolStatus, WalletTransactionStatus, WalletTransactionType, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addHours } from "date-fns";
import premium19Games from "./data/lf-3103-adv-01.json";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@luckyboloes.com" },
    update: {},
    create: {
      name: "Admin Lucky",
      email: "admin@luckyboloes.com",
      cpf: "11122233344",
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
      cpf: "22233344455",
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

  const contestC = await prisma.contest.upsert({
    where: { lotteryId_contestNumber: { lotteryId: lottery.id, contestNumber: 3102 } },
    update: {},
    create: {
      lotteryId: lottery.id,
      contestNumber: 3102,
      drawDate: addDays(new Date(), 6),
      status: "scheduled",
    },
  });

  const contestD = await prisma.contest.upsert({
    where: { lotteryId_contestNumber: { lotteryId: lottery.id, contestNumber: 3103 } },
    update: {},
    create: {
      lotteryId: lottery.id,
      contestNumber: 3103,
      drawDate: addDays(new Date(), 8),
      status: "scheduled",
    },
  });

  const contestE = await prisma.contest.upsert({
    where: { lotteryId_contestNumber: { lotteryId: lottery.id, contestNumber: 3104 } },
    update: {},
    create: {
      lotteryId: lottery.id,
      contestNumber: 3104,
      drawDate: addDays(new Date(), 10),
      status: "scheduled",
    },
  });

  await prisma.walletPackage.upsert({
    where: { title: "Pacote de R$ 50" },
    update: {},
    create: {
      title: "Pacote de R$ 50",
      description: "R$ 50 de saldo para comprar cotas com Pix.",
      price: new Prisma.Decimal(50),
    },
  });

  await prisma.walletPackage.upsert({
    where: { title: "Pacote de R$ 100" },
    update: {},
    create: {
      title: "Pacote de R$ 100",
      description: "R$ 100 de saldo para participar de bolões maiores.",
      price: new Prisma.Decimal(100),
    },
  });

  await prisma.walletPackage.upsert({
    where: { title: "Pacote de R$ 200" },
    update: {},
    create: {
      title: "Pacote de R$ 200",
      description: "R$ 200 de saldo para compras rápidas e múltiplas cotas.",
      price: new Prisma.Decimal(200),
    },
  });

  const accessibleGames = [
    { title: "Jogo 1", numbers: [1, 2, 3, 4, 5, 6, 8, 10, 11, 13, 14, 17, 21, 23, 24] },
    { title: "Jogo 2", numbers: [1, 2, 3, 4, 5, 6, 8, 10, 11, 13, 17, 19, 21, 24, 25] },
    { title: "Jogo 3", numbers: [1, 2, 3, 5, 6, 10, 11, 13, 14, 17, 19, 21, 23, 24, 25] },
    { title: "Jogo 4", numbers: [2, 3, 4, 5, 8, 10, 11, 13, 14, 17, 19, 21, 23, 24, 25] },
  ];

  const poolSimple = await prisma.pool.upsert({
    where: { code: "LF-3100-SIM-01" },
    update: {
      title: "Lotofacil 3100 Fechamento 17 dezenas",
      description: "Bolão mais acessível com 4 jogos de 15 dezenas, equivalente a 17 dezenas.",
      totalValue: new Prisma.Decimal(20),
      sharePrice: new Prisma.Decimal(4),
      totalShares: 5,
      availableShares: 5,
      relativeChance: "4 jogos com equivalência de 17 dezenas",
      status: PoolStatus.OPEN,
    },
    create: {
      code: "LF-3100-SIM-01",
      lotteryId: lottery.id,
      gameTypeId: simpleType.id,
      contestId: contestA.id,
      title: "Lotofacil 3100 Fechamento 17 dezenas",
      description: "Bolão mais acessível com 4 jogos de 15 dezenas, equivalente a 17 dezenas.",
      totalValue: new Prisma.Decimal(20),
      sharePrice: new Prisma.Decimal(4),
      totalShares: 5,
      availableShares: 5,
      relativeChance: "4 jogos com equivalência de 17 dezenas",
      ticketImageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: accessibleGames,
      },
    },
  });

  await prisma.poolGame.deleteMany({
    where: { poolId: poolSimple.id },
  });

  await prisma.poolGame.createMany({
    data: accessibleGames.map((game) => ({
      poolId: poolSimple.id,
      title: game.title,
      numbers: game.numbers,
    })),
  });

  const economicGames = [
    { title: "Jogo 1", numbers: [1, 3, 4, 5, 6, 7, 9, 12, 13, 16, 17, 18, 20, 21, 23] },
    { title: "Jogo 2", numbers: [1, 3, 4, 5, 6, 7, 9, 12, 13, 16, 17, 19, 21, 23, 25] },
    { title: "Jogo 3", numbers: [1, 3, 5, 6, 7, 9, 13, 16, 17, 18, 19, 20, 21, 23, 25] },
    { title: "Jogo 4", numbers: [1, 4, 5, 7, 9, 12, 13, 16, 17, 18, 19, 20, 21, 23, 25] },
  ];

  const economicPool = await prisma.pool.upsert({
    where: { code: "LF-3104-SIM-01" },
    update: {
      title: "Lotofacil 3104 Cotas economicas",
      description: "Bolao com 4 jogos de 15 dezenas e 10 cotas de R$ 2,50.",
      totalValue: new Prisma.Decimal(25),
      sharePrice: new Prisma.Decimal(2.5),
      totalShares: 10,
      availableShares: 10,
      relativeChance: "4 jogos selecionados com entrada economica",
      status: PoolStatus.OPEN,
    },
    create: {
      code: "LF-3104-SIM-01",
      lotteryId: lottery.id,
      gameTypeId: simpleType.id,
      contestId: contestE.id,
      title: "Lotofacil 3104 Cotas economicas",
      description: "Bolao com 4 jogos de 15 dezenas e 10 cotas de R$ 2,50.",
      totalValue: new Prisma.Decimal(25),
      sharePrice: new Prisma.Decimal(2.5),
      totalShares: 10,
      availableShares: 10,
      relativeChance: "4 jogos selecionados com entrada economica",
      ticketImageUrl: "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: economicGames,
      },
    },
  });

  await prisma.poolGame.deleteMany({
    where: { poolId: economicPool.id },
  });

  await prisma.poolGame.createMany({
    data: economicGames.map((game) => ({
      poolId: economicPool.id,
      title: game.title,
      numbers: game.numbers,
    })),
  });

  const fixedGames = [
    { title: "Jogo 1", numbers: [1, 2, 3, 4, 5, 6, 7, 9, 13, 14, 15, 19, 21, 24, 25] },
    { title: "Jogo 2", numbers: [1, 2, 3, 4, 5, 6, 7, 9, 13, 14, 18, 19, 21, 23, 24] },
    { title: "Jogo 3", numbers: [1, 2, 3, 4, 5, 6, 8, 9, 13, 15, 18, 21, 23, 24, 25] },
    { title: "Jogo 4", numbers: [1, 2, 3, 4, 5, 6, 8, 13, 14, 15, 18, 21, 23, 24, 25] },
    { title: "Jogo 5", numbers: [1, 2, 3, 4, 5, 7, 8, 9, 13, 14, 15, 19, 21, 23, 24] },
    { title: "Jogo 6", numbers: [1, 2, 3, 4, 5, 7, 8, 9, 13, 14, 18, 19, 21, 24, 25] },
    { title: "Jogo 7", numbers: [1, 2, 3, 5, 6, 7, 8, 13, 15, 18, 19, 21, 23, 24, 25] },
    { title: "Jogo 8", numbers: [1, 2, 3, 5, 6, 8, 9, 13, 14, 15, 18, 21, 23, 24, 25] },
    { title: "Jogo 9", numbers: [2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 18, 19, 21, 24] },
    { title: "Jogo 10", numbers: [2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 19, 21, 23, 24, 25] },
    { title: "Jogo 11", numbers: [2, 3, 4, 5, 7, 9, 13, 14, 15, 18, 19, 21, 23, 24, 25] },
  ];

  const fixedPool = await prisma.pool.upsert({
    where: { code: "LF-3101-ADV-01" },
    update: {
      title: "Lotofacil 3101 Fechamento 18 dezenas",
      description: "Bolão fixo com 11 jogos de 15 dezenas, equivalente a 18 dezenas.",
      totalValue: new Prisma.Decimal(60),
      sharePrice: new Prisma.Decimal(6),
      totalShares: 10,
      availableShares: 10,
      relativeChance: "11 jogos com equivalência de 18 dezenas",
      ticketImageUrl: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
    },
    create: {
      code: "LF-3101-ADV-01",
      lotteryId: lottery.id,
      gameTypeId: advancedType.id,
      contestId: contestB.id,
      title: "Lotofacil 3101 Fechamento 18 dezenas",
      description: "Bolão fixo com 11 jogos de 15 dezenas, equivalente a 18 dezenas.",
      totalValue: new Prisma.Decimal(60),
      sharePrice: new Prisma.Decimal(6),
      totalShares: 10,
      availableShares: 10,
      relativeChance: "11 jogos com equivalência de 18 dezenas",
      ticketImageUrl: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: fixedGames,
      },
    },
  });

  await prisma.poolGame.deleteMany({
    where: { poolId: fixedPool.id },
  });

  await prisma.poolGame.createMany({
    data: fixedGames.map((game) => ({
      poolId: fixedPool.id,
      title: game.title,
      numbers: game.numbers,
    })),
  });

  const premium18Games = [
    { title: "Jogo 1", numbers: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 19, 21, 23, 24, 25] },
    { title: "Jogo 2", numbers: [1, 2, 3, 5, 6, 7, 9, 10, 13, 17, 19, 20, 21, 23, 24] },
    { title: "Jogo 3", numbers: [1, 2, 3, 5, 6, 7, 9, 11, 13, 15, 17, 20, 23, 24, 25] },
    { title: "Jogo 4", numbers: [1, 2, 3, 5, 6, 7, 11, 13, 15, 17, 19, 20, 21, 24, 25] },
    { title: "Jogo 5", numbers: [1, 2, 3, 5, 6, 9, 10, 11, 13, 15, 17, 20, 23, 24, 25] },
    { title: "Jogo 6", numbers: [1, 2, 3, 5, 6, 10, 11, 13, 15, 17, 19, 20, 21, 24, 25] },
    { title: "Jogo 7", numbers: [1, 2, 3, 5, 7, 9, 10, 11, 13, 15, 17, 19, 20, 24, 25] },
    { title: "Jogo 8", numbers: [1, 2, 3, 5, 7, 10, 11, 13, 15, 17, 20, 21, 23, 24, 25] },
    { title: "Jogo 9", numbers: [1, 2, 3, 5, 9, 10, 11, 13, 17, 19, 20, 21, 23, 24, 25] },
    { title: "Jogo 10", numbers: [1, 2, 5, 6, 7, 9, 10, 11, 13, 15, 17, 20, 21, 24, 25] },
    { title: "Jogo 11", numbers: [1, 2, 5, 6, 7, 10, 11, 13, 15, 17, 19, 20, 23, 24, 25] },
    { title: "Jogo 12", numbers: [1, 2, 5, 6, 9, 11, 13, 15, 17, 19, 20, 21, 23, 24, 25] },
    { title: "Jogo 13", numbers: [1, 2, 5, 7, 9, 11, 13, 15, 17, 19, 20, 21, 23, 24, 25] },
    { title: "Jogo 14", numbers: [1, 3, 5, 6, 7, 9, 10, 11, 13, 15, 17, 19, 21, 23, 24] },
    { title: "Jogo 15", numbers: [1, 3, 5, 6, 7, 9, 10, 13, 15, 19, 20, 21, 23, 24, 25] },
    { title: "Jogo 16", numbers: [2, 3, 5, 6, 7, 9, 10, 11, 13, 15, 19, 20, 21, 23, 24] },
    { title: "Jogo 17", numbers: [2, 3, 5, 6, 7, 9, 10, 13, 15, 17, 19, 21, 23, 24, 25] },
    { title: "Jogo 18", numbers: [3, 5, 6, 7, 9, 10, 11, 13, 17, 19, 20, 21, 23, 24, 25] },
  ];

  const premium18Pool = await prisma.pool.upsert({
    where: { code: "LF-3102-ADV-01" },
    update: {
      title: "Lotofacil 3102 Fechamento 18 jogos",
      description: "Bolão com 18 jogos de 15 dezenas, equivalente a 18 dezenas.",
      totalValue: new Prisma.Decimal(100),
      sharePrice: new Prisma.Decimal(10),
      totalShares: 10,
      availableShares: 10,
      relativeChance: "18 jogos com equivalência de 18 dezenas",
      status: PoolStatus.OPEN,
    },
    create: {
      code: "LF-3102-ADV-01",
      lotteryId: lottery.id,
      gameTypeId: advancedType.id,
      contestId: contestC.id,
      title: "Lotofacil 3102 Fechamento 18 jogos",
      description: "Bolão com 18 jogos de 15 dezenas, equivalente a 18 dezenas.",
      totalValue: new Prisma.Decimal(100),
      sharePrice: new Prisma.Decimal(10),
      totalShares: 10,
      availableShares: 10,
      relativeChance: "18 jogos com equivalência de 18 dezenas",
      ticketImageUrl: "https://images.unsplash.com/photo-1484482340112-e1e2682b4856?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: premium18Games,
      },
    },
  });

  await prisma.poolGame.deleteMany({
    where: { poolId: premium18Pool.id },
  });

  await prisma.poolGame.createMany({
    data: premium18Games.map((game) => ({
      poolId: premium18Pool.id,
      title: game.title,
      numbers: game.numbers,
    })),
  });

  const premium19Pool = await prisma.pool.upsert({
    where: { code: "LF-3103-ADV-01" },
    update: {
      title: "Lotofacil 3103 Fechamento 19 dezenas",
      description: "Bolão com 110 jogos de 15 dezenas, equivalente a 19 dezenas.",
      totalValue: new Prisma.Decimal(500),
      sharePrice: new Prisma.Decimal(10),
      totalShares: 50,
      availableShares: 50,
      relativeChance: "110 jogos com equivalência de 19 dezenas",
      status: PoolStatus.OPEN,
    },
    create: {
      code: "LF-3103-ADV-01",
      lotteryId: lottery.id,
      gameTypeId: advancedType.id,
      contestId: contestD.id,
      title: "Lotofacil 3103 Fechamento 19 dezenas",
      description: "Bolão com 110 jogos de 15 dezenas, equivalente a 19 dezenas.",
      totalValue: new Prisma.Decimal(500),
      sharePrice: new Prisma.Decimal(10),
      totalShares: 50,
      availableShares: 50,
      relativeChance: "110 jogos com equivalência de 19 dezenas",
      ticketImageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
      status: PoolStatus.OPEN,
      games: {
        create: premium19Games,
      },
    },
  });

  await prisma.poolGame.deleteMany({
    where: { poolId: premium19Pool.id },
  });

  await prisma.poolGame.createMany({
    data: premium19Games.map((game) => ({
      poolId: premium19Pool.id,
      title: game.title,
      numbers: game.numbers,
    })),
  });

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
        message: "Sua conta foi criada com sucesso. Agora você já pode acompanhar seus bolões e movimentações.",
      },
      {
        userId: admin.id,
        type: "INFO",
        title: "Atualização da conta",
        message: "Sua conta está pronta para acompanhar concursos, bolões e movimentações.",
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
        newData: { lotteries: 1, contests: 5, pools: 5 },
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
