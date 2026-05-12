-- CreateTable
CREATE TABLE "user_prompt_template_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_template_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_prompt_template_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_prompt_template_states_user_id_is_active_idx" ON "user_prompt_template_states"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_prompt_template_states_user_id_prompt_template_id_key" ON "user_prompt_template_states"("user_id", "prompt_template_id");

-- AddForeignKey
ALTER TABLE "user_prompt_template_states" ADD CONSTRAINT "user_prompt_template_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prompt_template_states" ADD CONSTRAINT "user_prompt_template_states_prompt_template_id_fkey" FOREIGN KEY ("prompt_template_id") REFERENCES "prompt_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
