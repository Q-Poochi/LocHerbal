-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "discount_start_at" TIMESTAMP(3),
ADD COLUMN     "discount_end_at" TIMESTAMP(3);