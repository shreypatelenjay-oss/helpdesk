-- AlterTable: set ticket default status to NEW
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'NEW';
