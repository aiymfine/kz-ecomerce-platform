-- AlterEnum
ALTER TYPE "ShippingMethod" ADD VALUE 'digital';

-- AlterTable
ALTER TABLE "merchants" ALTER COLUMN "reset_password_token" SET DATA TYPE TEXT;
