# Generate Prisma Database Migration

Create or update the Prisma schema and generate a migration.

## Input
- Description: $ARGUMENTS (e.g., "add servers table", "add deployment_docs relation")

## Instructions

1. Read `CLAUDE.md` for database conventions.
2. Read `docs/SRS.md` for the entity definition and ERD relationships.
3. Read the current `packages/backend/prisma/schema.prisma` to understand existing models.

4. **Update schema.prisma** following these rules:
   - Table names: `snake_case` plural (use `@@map("table_name")`)
   - Column names: `snake_case` (use `@map("column_name")`)
   - Primary key: `id String @id @default(uuid())`
   - Every model MUST have: `createdAt DateTime @default(now()) @map("created_at")` and `updatedAt DateTime @updatedAt @map("updated_at")`
   - Soft delete: `deletedAt DateTime? @map("deleted_at")`
   - Enums: UPPER_SNAKE_CASE values
   - Add `@@index` for all foreign keys and commonly filtered fields
   - Add proper relations with `@relation`

5. **Generate migration**:
   ```bash
   cd packages/backend && npx prisma migrate dev --name <descriptive_name>
   ```

6. **Generate Prisma Client**:
   ```bash
   cd packages/backend && npx prisma generate
   ```

7. **Verify**: Check that the migration SQL looks correct and doesn't drop existing data.

## Database Conventions Reference
- UUID primary keys (not auto-increment)
- Soft delete everywhere — `deleted_at` nullable timestamp
- Enums defined in Prisma schema
- JSON columns for flexible data (audit log old_value/new_value, topology snapshot payload)
- Timestamps in UTC

## Checklist
- [ ] Model follows naming conventions (snake_case mapped)
- [ ] Has id, created_at, updated_at, deleted_at
- [ ] Foreign keys have @@index
- [ ] Relations defined with onDelete behavior
- [ ] Enums are UPPER_SNAKE_CASE
- [ ] Migration generated and tested
- [ ] No destructive changes to existing data
