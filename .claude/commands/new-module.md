# Scaffold New Backend Module

Create a new NestJS module following the project's standard structure.

## Input
- Module name: $ARGUMENTS (e.g., "server", "hardware", "deployment")

## Instructions

1. Read `CLAUDE.md` for the module architecture rules and conventions.
2. Read `docs/SRS.md` to understand the functional requirements for this module.
3. Create the following files under `packages/backend/src/modules/<module-name>/`:

```
<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── dto/
│   ├── create-<name>.dto.ts
│   ├── update-<name>.dto.ts
│   └── query-<name>.dto.ts
├── entities/
│   └── <name>.entity.ts
└── __tests__/
    ├── <name>.controller.spec.ts
    └── <name>.service.spec.ts
```

4. **Module file**: Register controller, service, and imports. Export service if other modules need it.
5. **Controller**: Implement standard CRUD endpoints:
   - `GET /api/v1/<module-name>` — list with pagination, sorting, filtering
   - `GET /api/v1/<module-name>/:id` — get by ID
   - `POST /api/v1/<module-name>` — create (ADMIN, OPERATOR)
   - `PATCH /api/v1/<module-name>/:id` — update (ADMIN, OPERATOR)
   - `DELETE /api/v1/<module-name>/:id` — soft delete (ADMIN, OPERATOR)
6. **Service**: Implement business logic using Prisma. Include:
   - Input validation via DTOs
   - Soft delete (set `deleted_at`)
   - Filter out soft-deleted records by default
   - Proper error handling (NotFoundException, ConflictException)
7. **DTOs**: Use class-validator decorators. Create DTO has required fields, Update DTO uses `PartialType(CreateDto)`.
8. **Entity**: Response shape (exclude internal fields like `deleted_at`).
9. **Tests**: Unit tests for service methods, mock PrismaService.
10. **Guards**: Apply `@Roles()` and `@RequireModule()` decorators appropriately based on SRS permission matrix.
11. Register the new module in `app.module.ts`.

## Checklist
- [ ] Module follows naming conventions from CLAUDE.md
- [ ] All endpoints are protected (auth + role + module guard)
- [ ] Soft delete implemented (no hard deletes)
- [ ] Pagination/filter/sort on list endpoint
- [ ] DTOs have proper validation decorators
- [ ] Unit tests created
- [ ] Module registered in app.module.ts
