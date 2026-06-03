ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'REFERRAL_BONUS';

ALTER TABLE "User"
ADD COLUMN "inviteCode" TEXT,
ADD COLUMN "referredByUserId" TEXT,
ADD COLUMN "referralRewardedAt" TIMESTAMP(3);

UPDATE "User"
SET "inviteCode" = 'ref-' || substring("id" from 1 for 12)
WHERE "inviteCode" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "inviteCode" SET NOT NULL;

CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

ALTER TABLE "User"
ADD CONSTRAINT "User_referredByUserId_fkey"
FOREIGN KEY ("referredByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Wallet"
ADD COLUMN "bonusBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;
