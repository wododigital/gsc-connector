-- AlterTable
ALTER TABLE "mcp_debug_logs" ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'gsc';

-- AlterTable
ALTER TABLE "usage_logs" ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'gsc';

-- CreateTable
CREATE TABLE "ga4_properties" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "account_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ga4_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ga4_properties_user_id_property_id_key" ON "ga4_properties"("user_id", "property_id");

-- AddForeignKey
ALTER TABLE "ga4_properties" ADD CONSTRAINT "ga4_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ga4_properties" ADD CONSTRAINT "ga4_properties_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "google_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
