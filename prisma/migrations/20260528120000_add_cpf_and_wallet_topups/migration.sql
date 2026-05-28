-- CreateEnum
CREATE TYPE "WalletTopupStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'EXPIRED', 'MANUAL_REVIEW');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "cpf" TEXT;

-- CreateTable
CREATE TABLE "WalletPackage" (
    "id" INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "WalletTopup" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");
CREATE UNIQUE INDEX "WalletPackage_title_key" ON "WalletPackage"("title");

-- AddForeignKey
ALTER TABLE "WalletTopup" ADD CONSTRAINT "WalletTopup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTopup" ADD CONSTRAINT "WalletTopup_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "WalletPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
