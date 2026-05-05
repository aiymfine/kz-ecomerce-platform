-- AlterTable
ALTER TABLE "merchants" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "merchants" ADD COLUMN "verification_code" VARCHAR(6);
ALTER TABLE "merchants" ADD COLUMN "verification_code_expires_at" TIMESTAMP(3);
ALTER TABLE "merchants" ADD COLUMN "reset_password_token" VARCHAR(255);
ALTER TABLE "merchants" ADD COLUMN "reset_password_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_reset_password_token_key" ON "merchants"("reset_password_token");
