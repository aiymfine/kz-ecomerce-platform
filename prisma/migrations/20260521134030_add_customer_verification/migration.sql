-- AlterTable: add email verification fields to customers
ALTER TABLE "customers" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN "verification_code" VARCHAR(6);
ALTER TABLE "customers" ADD COLUMN "verification_code_expires_at" TIMESTAMP;
