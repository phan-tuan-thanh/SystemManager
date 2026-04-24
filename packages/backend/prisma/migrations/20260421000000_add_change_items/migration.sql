-- AlterTable: add environment column to change_sets
ALTER TABLE "change_sets" ADD COLUMN "environment" VARCHAR(10);

-- CreateTable: change_items
CREATE TABLE "change_items" (
    "id" UUID NOT NULL,
    "changeset_id" UUID NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(100),
    "action" VARCHAR(20) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "change_items_changeset_id_idx" ON "change_items"("changeset_id");

-- AddForeignKey
ALTER TABLE "change_items" ADD CONSTRAINT "change_items_changeset_id_fkey"
    FOREIGN KEY ("changeset_id") REFERENCES "change_sets"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
