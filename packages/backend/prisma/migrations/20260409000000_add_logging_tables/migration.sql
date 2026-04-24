-- CreateTable
CREATE TABLE "system_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "meta" JSONB,
    "user_id" UUID,
    "session_id" TEXT,
    "url" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "client_logs_level_idx" ON "client_logs"("level");

-- CreateIndex
CREATE INDEX "client_logs_created_at_idx" ON "client_logs"("created_at");

-- CreateIndex
CREATE INDEX "client_logs_user_id_idx" ON "client_logs"("user_id");

-- Seed default logging config
INSERT INTO "system_configs" ("id", "key", "value", "updated_at") VALUES
  (gen_random_uuid(), 'LOG_ENABLED',    'true',    NOW()),
  (gen_random_uuid(), 'LOG_LEVEL',      'log',     NOW()),
  (gen_random_uuid(), 'LOG_TO_FILE',    'true',    NOW()),
  (gen_random_uuid(), 'LOG_TO_CONSOLE', 'true',    NOW());
