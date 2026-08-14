-- CreateTable
CREATE TABLE "page_blocks" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_blocks_page_is_published_idx" ON "page_blocks"("page", "is_published");
