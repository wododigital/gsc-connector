-- AlterTable
ALTER TABLE "user_prompts" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "user_prompts_user_id_is_active_idx" ON "user_prompts"("user_id", "is_active");
