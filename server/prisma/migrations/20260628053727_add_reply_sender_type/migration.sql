-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('AGENT', 'CUSTOMER');

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "senderType" "SenderType" NOT NULL DEFAULT 'AGENT';
