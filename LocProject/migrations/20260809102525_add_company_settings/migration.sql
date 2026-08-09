-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "about" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "hotline" TEXT,
    "email" TEXT,
    "working_hours" TEXT,
    "facebook_url" TEXT,
    "youtube_url" TEXT,
    "zalo_url" TEXT,
    "website_url" TEXT,
    "tax_code" TEXT,
    "business_license" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);
