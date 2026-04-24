-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "infra_system_id" UUID;

-- CreateIndex
CREATE INDEX "servers_infra_system_id_idx" ON "servers"("infra_system_id");

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_infra_system_id_fkey" FOREIGN KEY ("infra_system_id") REFERENCES "infra_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
