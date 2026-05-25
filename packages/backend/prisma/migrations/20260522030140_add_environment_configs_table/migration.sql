-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('DEV', 'UAT', 'PROD', 'LIVE');

-- Seed default environments BEFORE altering tables so FK lookups work from day 1
CREATE TABLE "environment_configs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "type" "EnvironmentType" NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#1890ff',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "environment_configs_code_key" ON "environment_configs"("code");
CREATE INDEX "environment_configs_type_idx" ON "environment_configs"("type");
CREATE INDEX "environment_configs_is_active_idx" ON "environment_configs"("is_active");

INSERT INTO "environment_configs" ("id", "code", "label", "type", "color", "sort_order", "is_active", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'PROD', 'Production',   'PROD', '#ff4d4f', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'UAT',  'UAT',          'UAT',  '#fa8c16', 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'DEV',  'Development',  'DEV',  '#52c41a', 3, true, NOW(), NOW());

-- Cast enum → varchar safely (no data loss)
ALTER TABLE "servers"         ALTER COLUMN "environment" TYPE VARCHAR(20) USING "environment"::text;
ALTER TABLE "app_deployments" ALTER COLUMN "environment" TYPE VARCHAR(20) USING "environment"::text;
ALTER TABLE "app_connections" ALTER COLUMN "environment" TYPE VARCHAR(20) USING "environment"::text;
ALTER TABLE "network_zones"   ALTER COLUMN "environment" TYPE VARCHAR(20) USING "environment"::text;
ALTER TABLE "firewall_rules"  ALTER COLUMN "environment" TYPE VARCHAR(20) USING "environment"::text;

-- DropEnum
DROP TYPE "Environment";

-- CreateIndex (environment indexes already existed on most tables; recreate for app_connections/app_deployments if missing)
CREATE INDEX IF NOT EXISTS "servers_environment_idx"         ON "servers"("environment");
CREATE INDEX IF NOT EXISTS "app_deployments_environment_idx" ON "app_deployments"("environment");
CREATE INDEX IF NOT EXISTS "app_connections_environment_idx" ON "app_connections"("environment");
CREATE INDEX IF NOT EXISTS "network_zones_environment_idx"   ON "network_zones"("environment");
CREATE INDEX IF NOT EXISTS "firewall_rules_environment_idx"  ON "firewall_rules"("environment");

-- Recreate unique index on network_zones (may already exist)
DROP INDEX IF EXISTS "network_zones_code_environment_key";
CREATE UNIQUE INDEX "network_zones_code_environment_key" ON "network_zones"("code", "environment");
