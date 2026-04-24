-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('BUSINESS', 'INFRASTRUCTURE');

-- AlterTable
ALTER TABLE "application_groups" ADD COLUMN     "group_type" "GroupType" NOT NULL DEFAULT 'BUSINESS';

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "eol_date" TIMESTAMP(3),
ADD COLUMN     "vendor" VARCHAR(255);
