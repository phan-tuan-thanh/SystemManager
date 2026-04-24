-- CreateTable
CREATE TABLE "topology_snapshots" (
    "id" UUID NOT NULL,
    "label" VARCHAR(255),
    "environment" VARCHAR(10),
    "payload" JSONB NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topology_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topology_snapshots_environment_idx" ON "topology_snapshots"("environment");

-- CreateIndex
CREATE INDEX "topology_snapshots_created_at_idx" ON "topology_snapshots"("created_at");
