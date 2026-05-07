-- Migration: add expires_at and never_expires to firewall_rules
-- Created: 2026-05-03

ALTER TABLE "firewall_rules"
  ADD COLUMN "expires_at" TIMESTAMP,
  ADD COLUMN "never_expires" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX "firewall_rules_expires_at_idx" ON "firewall_rules"("expires_at");
