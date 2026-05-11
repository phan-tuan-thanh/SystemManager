# DB Migration: <Title>

[Header per `_header.md`]

**Example**: "Add firewall_rules table" — New table for firewall rule CRUD operations with soft delete and audit support.

## Change Summary

This migration adds the `firewall_rules` table to support the firewall rules feature. The table includes columns for rule metadata (name, port, protocol, environment), timestamps, and soft delete support via `deleted_at` column. Includes indexes for fast filtering by environment and deletion status. No existing data is modified; this is a purely additive change.

## Prisma Schema Change

File: `prisma/schema.prisma`

```prisma
model FirewallRule {
  id          String    @id @default(cuid())
  name        String
  port        Int       @db.SmallInt // 1-65535
  protocol    String    // 'tcp' | 'udp'
  environment String    // 'DEV' | 'UAT' | 'PROD'
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  createdBy   User      @relation(fields: [createdById], references: [id])
  createdById String    @map("created_by_id")

  @@unique([name, environment])
  @@index([environment, deletedAt])
  @@map("firewall_rules")
}
```

## Migration Phases

### Phase 1 — Additive (No Downtime)

**Forward**:
```sql
CREATE TABLE "firewall_rules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "port" SMALLINT NOT NULL,
    "protocol" VARCHAR(10) NOT NULL,
    "environment" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    CONSTRAINT "firewall_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "firewall_rules_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "firewall_rules_port_check" CHECK ("port" >= 1 AND "port" <= 65535),
    CONSTRAINT "firewall_rules_environment_check" 
        CHECK ("environment" IN ('DEV', 'UAT', 'PROD')),
    CONSTRAINT "firewall_rules_protocol_check" 
        CHECK ("protocol" IN ('tcp', 'udp')),
    CONSTRAINT "firewall_rules_name_environment_unique" UNIQUE ("name", "environment")
);

CREATE INDEX "firewall_rules_environment_deleted_at_idx" 
  ON "firewall_rules"("environment", "deleted_at");
```

**Rollback**:
```sql
DROP TABLE "firewall_rules" CASCADE;
```

### Phase 2 — N/A

No subtractive phase needed; this is purely additive.

## Order of Operations

1. **Code preparation** (Architect + Senior Dev):
   - Update `prisma/schema.prisma` with `FirewallRule` model
   - Generate Prisma migration: `npx prisma migrate dev --name add_firewall_rules`
   - Review generated SQL migration file

2. **Testing** (Senior Dev + QA):
   - Run migration locally: `npx prisma migrate dev`
   - Verify schema in Prisma Studio: `npm run db:studio`
   - Run integration tests against migrated schema
   - Test soft delete behavior (SELECT WHERE deleted_at IS NULL)

3. **Staging validation** (DevOps):
   - Apply migration to UAT database (replica of PROD)
   - Verify table structure: `\d firewall_rules`
   - Verify indexes: `SELECT indexname FROM pg_indexes WHERE tablename='firewall_rules';`
   - Run performance test (list 1000+ rules, expect < 200ms p95)

4. **Production deployment** (DevOps):
   - Schedule maintenance window (off-peak hours, e.g., 2-3 AM)
   - Notify on-call team and operators
   - Deploy application version with migration: `npx prisma migrate deploy`
   - Verify application starts without errors
   - Run smoke tests (create test rule, verify in list)

## Lock / Downtime Impact

- **Estimated lock time**: < 1 second (table creation is fast, no data rewrite)
- **Downtime**: **Zero downtime** — migration is fully additive, no existing queries affected
- **Online vs offline**: Online — migration can run while application is running
- **Rollback time**: < 5 seconds (just DROP TABLE)
- **Application deployment**: Must deploy new code with Prisma schema before migration; can do schema-first or app-first approach (safe here since additive)

## Data Validation

- **Pre-migration count**:
  ```sql
  SELECT COUNT(*) FROM "users"; -- verify reference table exists
  ```

- **Post-migration validation**:
  ```sql
  SELECT COUNT(*) FROM "firewall_rules"; -- should be 0 (new table)
  SELECT COUNT(*) FROM "firewall_rules" WHERE "deleted_at" IS NULL; -- verify soft delete filter
  -- Verify indexes exist
  SELECT indexname FROM pg_indexes WHERE tablename='firewall_rules';
  ```

- **Constraint verification**:
  ```sql
  -- Test port constraint (should fail)
  INSERT INTO "firewall_rules" (..., port = -1, ...); -- expect error
  
  -- Test environment constraint (should fail)
  INSERT INTO "firewall_rules" (..., environment = 'INVALID', ...); -- expect error
  
  -- Test unique constraint (should fail if duplicate name+env)
  INSERT INTO "firewall_rules" (name, environment, ...) VALUES ('rule1', 'DEV', ...);
  INSERT INTO "firewall_rules" (name, environment, ...) VALUES ('rule1', 'DEV', ...); -- expect error
  ```

## Rollback

- **Window**: < 5 seconds
- **Command**: `npx prisma migrate resolve --rolled-back add_firewall_rules`
- **Data divergence after rollback**: 
  - Soft-deleted rules stored in `firewall_rules` during migration window become inaccessible (table gone)
  - Application must revert to code that doesn't reference `FirewallRule` model
  - If rollback occurs, any rules created between migration and rollback are lost (table dropped)
  - **Mitigation**: Keep migration window very short, have monitoring alerts ready

## Alternative Rollback (Manual)

If Prisma rollback fails:
```sql
DROP TABLE "firewall_rules" CASCADE;
-- Revert application code to previous version
```

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Migration fails (syntax error) | Low | Table not created, app errors | Test on staging first, review generated SQL |
| Foreign key constraint fails | Low | Migration blocks (user_id invalid) | Verify `users` table has data before migration |
| Index creation slow | Low | Lock duration increases | For additive migration, index creation is non-blocking |
| Soft delete filter forgotten in code | High | Deleted rules visible in API | Unit tests verify filter; service layer adds `WHERE deleted_at IS NULL` |
| Rollback data loss | Medium | Rules created during migration lost | Keep window short, monitor for errors, alert on-call |
| Application OOM from duplicate model (Prisma cache) | Low | App crash | Restart application after migration completes |

## Tests / Validation

- [ ] Migration tested locally on fresh database
- [ ] Schema validated in Prisma Studio
- [ ] Integration tests run and pass with new schema
- [ ] Soft delete filtering tested (no deleted rules in list)
- [ ] Constraints tested (invalid port, environment, duplicate name rejected)
- [ ] Foreign key constraint tested (invalid user_id rejected)
- [ ] Migration tested on staging replica (full UAT dataset, ~50k rows)
- [ ] Performance test: list query with 1000 rules < 200ms p95
- [ ] Rollback procedure tested on staging
- [ ] Team notified of schema change
- [ ] Application deployment strategy confirmed (schema-first or code-first)

## Next steps

1. **Architect** (`.ai/agents/architect.md`):
   - Review Prisma schema changes
   - Verify soft delete strategy aligns with existing audit patterns
   - Update `.ai/memory/architecture.md` with schema diagram

2. **Senior Dev** (`.ai/agents/senior-dev.md`):
   - Create migration: `npx prisma migrate dev --name add_firewall_rules`
   - Test migration locally
   - Write integration tests for new table
   - Commit schema changes and migration file

3. **DevOps** (`.ai/agents/devops.md`):
   - Test migration on staging (replicate PROD data first)
   - Create deployment plan (DEV → UAT → PROD)
   - Prepare rollback runbook
   - Schedule maintenance window (if needed)
   - Set up monitoring for new table (query latency, row count, index usage)
   - Notify on-call team of migration timeline
