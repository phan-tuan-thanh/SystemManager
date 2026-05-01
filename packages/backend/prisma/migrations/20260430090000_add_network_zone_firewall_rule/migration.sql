-- CreateEnum
CREATE TYPE "NetworkZoneType" AS ENUM ('LOCAL', 'DMZ', 'DB', 'DEV', 'UAT', 'PROD', 'INTERNET', 'MANAGEMENT', 'STORAGE', 'BACKUP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FirewallAction" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "FirewallRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED');

-- CreateTable
CREATE TABLE "network_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "zone_type" "NetworkZoneType" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "color" VARCHAR(20),
    "environment" "Environment" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "network_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_ip_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "zone_id" UUID NOT NULL,
    "ip_address" VARCHAR(50) NOT NULL,
    "label" VARCHAR(200),
    "description" TEXT,
    "is_range" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "zone_ip_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firewall_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "environment" "Environment" NOT NULL,
    "source_zone_id" UUID,
    "source_ip" VARCHAR(50),
    "destination_zone_id" UUID,
    "destination_server_id" UUID NOT NULL,
    "destination_port_id" UUID,
    "protocol" VARCHAR(10) NOT NULL DEFAULT 'TCP',
    "action" "FirewallAction" NOT NULL DEFAULT 'ALLOW',
    "status" "FirewallRuleStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "request_date" TIMESTAMP(3),
    "approved_by" VARCHAR(200),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "firewall_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "network_zones_environment_idx" ON "network_zones"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "network_zones_code_environment_key" ON "network_zones"("code", "environment");

-- CreateIndex
CREATE INDEX "zone_ip_entries_zone_id_idx" ON "zone_ip_entries"("zone_id");

-- CreateIndex
CREATE INDEX "firewall_rules_environment_idx" ON "firewall_rules"("environment");

-- CreateIndex
CREATE INDEX "firewall_rules_source_zone_id_idx" ON "firewall_rules"("source_zone_id");

-- CreateIndex
CREATE INDEX "firewall_rules_destination_server_id_idx" ON "firewall_rules"("destination_server_id");

-- CreateIndex
CREATE INDEX "firewall_rules_destination_port_id_idx" ON "firewall_rules"("destination_port_id");

-- CreateIndex
CREATE INDEX "firewall_rules_status_idx" ON "firewall_rules"("status");

-- AddForeignKey
ALTER TABLE "zone_ip_entries" ADD CONSTRAINT "zone_ip_entries_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "network_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firewall_rules" ADD CONSTRAINT "firewall_rules_source_zone_id_fkey" FOREIGN KEY ("source_zone_id") REFERENCES "network_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firewall_rules" ADD CONSTRAINT "firewall_rules_destination_zone_id_fkey" FOREIGN KEY ("destination_zone_id") REFERENCES "network_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firewall_rules" ADD CONSTRAINT "firewall_rules_destination_server_id_fkey" FOREIGN KEY ("destination_server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firewall_rules" ADD CONSTRAINT "firewall_rules_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "ports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
