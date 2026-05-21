-- CreateTable
CREATE TABLE "pro_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "org_type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'pricing_page',
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "contacted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pro_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pro_requests_status_created_at_idx" ON "pro_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "pro_requests_created_at_idx" ON "pro_requests"("created_at");
