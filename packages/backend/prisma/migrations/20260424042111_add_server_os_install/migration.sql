/*
  Warnings:

  - The `sw_type` column on the `system_software` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[current_os_install_id]` on the table `servers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SwType" AS ENUM ('OS', 'MIDDLEWARE', 'DATABASE', 'RUNTIME', 'WEB_SERVER', 'OTHER');

-- DropIndex
DROP INDEX "app_connections_target_port_id_idx";

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "sw_type" "SwType";

-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "current_os_install_id" UUID;

-- AlterTable
ALTER TABLE "system_software" DROP COLUMN "sw_type",
ADD COLUMN     "sw_type" "SwType";

-- CreateTable
CREATE TABLE "server_os_installs" (
    "id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "version" VARCHAR(100) NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL,
    "installed_by_id" UUID,
    "replaced_at" TIMESTAMP(3),
    "change_reason" VARCHAR(500),
    "change_ticket" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_os_installs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "server_os_installs_server_id_idx" ON "server_os_installs"("server_id");

-- CreateIndex
CREATE INDEX "server_os_installs_application_id_idx" ON "server_os_installs"("application_id");

-- CreateIndex
CREATE INDEX "server_os_installs_server_id_replaced_at_idx" ON "server_os_installs"("server_id", "replaced_at");

-- CreateIndex
CREATE UNIQUE INDEX "servers_current_os_install_id_key" ON "servers"("current_os_install_id");

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_current_os_install_id_fkey" FOREIGN KEY ("current_os_install_id") REFERENCES "server_os_installs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_os_installs" ADD CONSTRAINT "server_os_installs_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_os_installs" ADD CONSTRAINT "server_os_installs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_os_installs" ADD CONSTRAINT "server_os_installs_installed_by_id_fkey" FOREIGN KEY ("installed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
