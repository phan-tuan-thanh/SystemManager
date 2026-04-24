-- AlterTable
ALTER TABLE "client_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ports" ADD COLUMN     "url" VARCHAR(500);

-- AlterTable
ALTER TABLE "system_configs" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "infra_systems" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "infra_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_system_servers" (
    "id" UUID NOT NULL,
    "system_id" UUID NOT NULL,
    "server_id" UUID NOT NULL,

    CONSTRAINT "infra_system_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_system_access" (
    "id" UUID NOT NULL,
    "system_id" UUID NOT NULL,
    "user_id" UUID,
    "group_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infra_system_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "infra_systems_code_key" ON "infra_systems"("code");

-- CreateIndex
CREATE INDEX "infra_systems_code_idx" ON "infra_systems"("code");

-- CreateIndex
CREATE INDEX "infra_system_servers_system_id_idx" ON "infra_system_servers"("system_id");

-- CreateIndex
CREATE INDEX "infra_system_servers_server_id_idx" ON "infra_system_servers"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "infra_system_servers_system_id_server_id_key" ON "infra_system_servers"("system_id", "server_id");

-- CreateIndex
CREATE INDEX "infra_system_access_system_id_idx" ON "infra_system_access"("system_id");

-- CreateIndex
CREATE INDEX "infra_system_access_user_id_idx" ON "infra_system_access"("user_id");

-- CreateIndex
CREATE INDEX "infra_system_access_group_id_idx" ON "infra_system_access"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "infra_system_access_system_id_user_id_key" ON "infra_system_access"("system_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "infra_system_access_system_id_group_id_key" ON "infra_system_access"("system_id", "group_id");

-- AddForeignKey
ALTER TABLE "infra_system_servers" ADD CONSTRAINT "infra_system_servers_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "infra_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_system_servers" ADD CONSTRAINT "infra_system_servers_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_system_access" ADD CONSTRAINT "infra_system_access_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "infra_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_system_access" ADD CONSTRAINT "infra_system_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_system_access" ADD CONSTRAINT "infra_system_access_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
