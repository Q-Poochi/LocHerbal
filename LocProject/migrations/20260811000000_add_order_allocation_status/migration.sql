-- AlterEnum
CREATE TYPE "AllocationStatus" AS ENUM ('PENDING', 'ALLOCATED', 'FAILED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "allocation_status" "AllocationStatus" NOT NULL DEFAULT 'PENDING';
