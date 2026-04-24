-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEV', 'UAT', 'PROD');

-- CreateEnum
CREATE TYPE "ServerPurpose" AS ENUM ('APP_SERVER', 'DB_SERVER', 'PROXY', 'LOAD_BALANCER', 'CACHE', 'MESSAGE_QUEUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ServerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InfraType" AS ENUM ('VIRTUAL_MACHINE', 'PHYSICAL_SERVER', 'CONTAINER', 'CLOUD_INSTANCE');

-- CreateEnum
CREATE TYPE "Site" AS ENUM ('DC', 'DR');

-- CreateEnum
CREATE TYPE "HardwareType" AS ENUM ('CPU', 'RAM', 'HDD', 'SSD', 'NETWORK_CARD');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('RUNNING', 'STOPPED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PENDING', 'DRAFT', 'COMPLETE', 'WAIVED');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('HTTP', 'HTTPS', 'TCP', 'GRPC', 'AMQP', 'KAFKA', 'DATABASE');

-- CreateTable
CREATE TABLE "servers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "purpose" "ServerPurpose" NOT NULL DEFAULT 'APP_SERVER',
    "status" "ServerStatus" NOT NULL DEFAULT 'ACTIVE',
    "environment" "Environment" NOT NULL,
    "infra_type" "InfraType" NOT NULL DEFAULT 'VIRTUAL_MACHINE',
    "site" "Site" NOT NULL DEFAULT 'DC',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_components" (
    "id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "type" "HardwareType" NOT NULL,
    "model" VARCHAR(255),
    "manufacturer" VARCHAR(255),
    "serial" VARCHAR(100),
    "specs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hardware_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_configs" (
    "id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "interface" VARCHAR(50),
    "private_ip" VARCHAR(45),
    "public_ip" VARCHAR(45),
    "nat_ip" VARCHAR(45),
    "domain" VARCHAR(255),
    "subnet" VARCHAR(50),
    "gateway" VARCHAR(45),
    "dns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "network_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_groups" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "application_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50),
    "description" TEXT,
    "owner_team" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_software" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50),
    "sw_type" VARCHAR(100),
    "eol_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "system_software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_deployments" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "environment" "Environment" NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'RUNNING',
    "title" VARCHAR(255),
    "deployed_at" TIMESTAMP(3),
    "planned_at" TIMESTAMP(3),
    "cmc_name" VARCHAR(255),
    "deployer" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "app_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_doc_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "environments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_doc_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_docs" (
    "id" UUID NOT NULL,
    "deployment_id" UUID NOT NULL,
    "doc_type_id" UUID NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING',
    "preview_path" VARCHAR(500),
    "final_path" VARCHAR(500),
    "waived_reason" TEXT,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ports" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "deployment_id" UUID,
    "port_number" INTEGER NOT NULL,
    "protocol" VARCHAR(10) NOT NULL DEFAULT 'TCP',
    "service_name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_connections" (
    "id" UUID NOT NULL,
    "source_app_id" UUID NOT NULL,
    "target_app_id" UUID NOT NULL,
    "environment" "Environment" NOT NULL,
    "connection_type" "ConnectionType" NOT NULL DEFAULT 'HTTPS',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "app_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "servers_code_key" ON "servers"("code");

-- CreateIndex
CREATE INDEX "servers_environment_idx" ON "servers"("environment");

-- CreateIndex
CREATE INDEX "servers_status_idx" ON "servers"("status");

-- CreateIndex
CREATE INDEX "hardware_components_server_id_idx" ON "hardware_components"("server_id");

-- CreateIndex
CREATE INDEX "network_configs_server_id_idx" ON "network_configs"("server_id");

-- CreateIndex
CREATE INDEX "network_configs_private_ip_idx" ON "network_configs"("private_ip");

-- CreateIndex
CREATE UNIQUE INDEX "application_groups_code_key" ON "application_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "applications_code_key" ON "applications"("code");

-- CreateIndex
CREATE INDEX "applications_group_id_idx" ON "applications"("group_id");

-- CreateIndex
CREATE INDEX "system_software_group_id_idx" ON "system_software"("group_id");

-- CreateIndex
CREATE INDEX "app_deployments_application_id_idx" ON "app_deployments"("application_id");

-- CreateIndex
CREATE INDEX "app_deployments_server_id_idx" ON "app_deployments"("server_id");

-- CreateIndex
CREATE INDEX "app_deployments_environment_idx" ON "app_deployments"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_doc_types_code_key" ON "deployment_doc_types"("code");

-- CreateIndex
CREATE INDEX "deployment_docs_deployment_id_idx" ON "deployment_docs"("deployment_id");

-- CreateIndex
CREATE INDEX "ports_application_id_idx" ON "ports"("application_id");

-- CreateIndex
CREATE INDEX "ports_deployment_id_idx" ON "ports"("deployment_id");

-- CreateIndex
CREATE INDEX "app_connections_source_app_id_idx" ON "app_connections"("source_app_id");

-- CreateIndex
CREATE INDEX "app_connections_target_app_id_idx" ON "app_connections"("target_app_id");

-- CreateIndex
CREATE INDEX "app_connections_environment_idx" ON "app_connections"("environment");

-- AddForeignKey
ALTER TABLE "hardware_components" ADD CONSTRAINT "hardware_components_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_configs" ADD CONSTRAINT "network_configs_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "application_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_software" ADD CONSTRAINT "system_software_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "application_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_deployments" ADD CONSTRAINT "app_deployments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_deployments" ADD CONSTRAINT "app_deployments_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_docs" ADD CONSTRAINT "deployment_docs_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "app_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_docs" ADD CONSTRAINT "deployment_docs_doc_type_id_fkey" FOREIGN KEY ("doc_type_id") REFERENCES "deployment_doc_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ports" ADD CONSTRAINT "ports_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ports" ADD CONSTRAINT "ports_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "app_deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_connections" ADD CONSTRAINT "app_connections_source_app_id_fkey" FOREIGN KEY ("source_app_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_connections" ADD CONSTRAINT "app_connections_target_app_id_fkey" FOREIGN KEY ("target_app_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
