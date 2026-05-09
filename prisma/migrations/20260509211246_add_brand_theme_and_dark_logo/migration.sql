-- AlterTable
ALTER TABLE "brand_profiles" ADD COLUMN     "logo_url_dark" TEXT,
ADD COLUMN     "report_theme" TEXT NOT NULL DEFAULT 'light';
