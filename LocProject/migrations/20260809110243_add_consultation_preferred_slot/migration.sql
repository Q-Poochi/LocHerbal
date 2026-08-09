-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "LeadStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "consultation_leads" ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "preferred_date" TIMESTAMP(3),
ADD COLUMN     "preferred_time" TEXT;
