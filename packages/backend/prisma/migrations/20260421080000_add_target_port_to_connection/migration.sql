-- AlterTable: Add target_port_id to app_connections
ALTER TABLE "app_connections" ADD COLUMN "target_port_id" UUID;

-- AddForeignKey
ALTER TABLE "app_connections" ADD CONSTRAINT "app_connections_target_port_id_fkey" FOREIGN KEY ("target_port_id") REFERENCES "ports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "app_connections_target_port_id_idx" ON "app_connections"("target_port_id");
