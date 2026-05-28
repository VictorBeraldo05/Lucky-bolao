-- Adicionar coluna CPF na tabela User se não existir
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cpf" TEXT;

-- Criar enum WalletTopupStatus se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WalletTopupStatus') THEN
    CREATE TYPE "WalletTopupStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'EXPIRED', 'MANUAL_REVIEW');
  END IF;
END$$;

-- Criar tabela WalletPackage se não existir
CREATE TABLE IF NOT EXISTS "WalletPackage" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela WalletTopup se não existir
CREATE TABLE IF NOT EXISTS "WalletTopup" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" INTEGER NOT NULL,
    "providerChargeId" TEXT,
    "correlationId" TEXT,
    "payerCpfExpected" TEXT,
    "status" "WalletTopupStatus" NOT NULL DEFAULT 'PENDING',
    "qrCodeText" TEXT,
    "qrCodeImageBase64" TEXT,
    "paymentLinkUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "providerPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WalletTopup') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'WalletTopup' AND constraint_name = 'WalletTopup_userId_fkey'
    ) THEN
      ALTER TABLE "WalletTopup" ADD CONSTRAINT "WalletTopup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'WalletTopup' AND constraint_name = 'WalletTopup_packageId_fkey'
    ) THEN
      ALTER TABLE "WalletTopup" ADD CONSTRAINT "WalletTopup_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "WalletPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END IF;
END$$;

-- Criar índices se não existirem
CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_key" ON "User"("cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "WalletPackage_title_key" ON "WalletPackage"("title");
