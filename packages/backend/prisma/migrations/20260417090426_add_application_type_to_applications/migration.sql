-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('BUSINESS', 'SYSTEM');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "application_type" "ApplicationType" NOT NULL DEFAULT 'BUSINESS';
