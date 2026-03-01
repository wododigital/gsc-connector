-- AlterTable
ALTER TABLE "usage_logs" ADD COLUMN     "response_time_ms" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'success';
