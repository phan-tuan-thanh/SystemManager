# Build Sprint

Implement all tasks for a sprint defined in TASKS.md, then update tracking files.

## Input
- Sprint number: $ARGUMENTS (e.g., "1", "2", "3")

## Pre-flight

1. Read `CLAUDE.md` — conventions, module rules, auth/security rules.
2. Read `TASKS.md` — find the sprint matching the input number, extract all tasks.
3. Read `deployment-status.json` — understand current runtime state, what's already built.
4. Read `reports/sprint-template.md` — the report format to produce at the end.

**CRITICAL — IDE linter issue:** The IDE may silently rewrite files when opened, replacing Prisma imports with broken type aliases and mock classes. Before editing any existing file, read it first and check:
- `prisma.service.ts` must have `extends PrismaClient` (not a mock class)
- Files must not use `@IsEnum(SomePrismaEnum)` — use `@IsIn([...] as const)` instead
- Decorators must use string literals: `@Roles('ADMIN')` not `@Roles(Role.ADMIN)`

If any file looks corrupted, restore it before proceeding.

## Instructions

### Phase 1 — Plan

1. List all tasks for the sprint from `TASKS.md`.
2. Group tasks by type: `[BE]` backend, `[FE]` frontend, `[INT]` integration.
3. Identify dependencies between tasks and determine implementation order.
4. Read all existing files that will be modified before touching them.

### Phase 2 — Implement Backend Tasks `[BE]`

For each backend task, follow these rules:

**Module structure** (create if new module):
```
packages/backend/src/modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
├── dto/
│   ├── create-<name>.dto.ts     # Required fields + @IsNotEmpty
│   ├── update-<name>.dto.ts     # PartialType(CreateDto)
│   └── query-<name>.dto.ts      # extends PaginationDto, all @IsOptional
├── entities/
│   └── <name>.entity.ts         # Response shape (ApiProperty decorated)
└── __tests__/
    └── <name>.service.spec.ts   # Unit tests, mock PrismaService
```

**Conventions to enforce:**
- NEVER use `@IsEnum(PrismaEnum)` — always `@IsIn(['VAL1','VAL2'] as const)`
- NEVER use Prisma enum as runtime value — always string literal `'ACTIVE'`
- NEVER hard delete — set `deleted_at` (soft delete)
- ALWAYS filter `deletedAt: null` in list queries
- ALWAYS add `@ApiOperation({ summary: '...' })` to every endpoint
- ALWAYS extend `PaginationDto` for list query DTOs
- ALWAYS apply `@Roles('ADMIN', 'OPERATOR')` or appropriate roles
- ALWAYS apply `@RequireModule('MODULE_KEY')` on controllers (use `@UseGuards(ModuleGuard)`)
- List responses: `{ data: [...], meta: { total, page, limit } }`
- Single responses: `{ data: { ... } }`

**After creating a new module:** register it in `packages/backend/src/app.module.ts`.

### Phase 3 — Implement Frontend Tasks `[FE]`

For each frontend task:

**Page structure:**
```
packages/frontend/src/pages/<module>/
├── index.tsx              # List page
├── [id].tsx               # Detail page (if applicable)
├── components/
│   ├── <Name>List.tsx
│   ├── <Name>Form.tsx     # React Hook Form + Zod validation
│   └── <Name>Filter.tsx
└── hooks/
    └── use<Name>.ts       # TanStack Query hooks
```

**Conventions to enforce:**
- API hooks: `use<Name>List`, `use<Name>Detail`, `useCreate<Name>`, `useUpdate<Name>`, `useDelete<Name>`
- Invalidate queries after mutations: `queryClient.invalidateQueries(['<name>'])`
- Table: server-side pagination, Skeleton loader (not Spinner)
- Forms: React Hook Form + Zod, validation matches backend DTOs
- Delete: always show Popconfirm before calling delete mutation
- Errors: `message.error(...)` for action failures, ErrorBoundary for page crashes
- Add new routes to `packages/frontend/src/App.tsx`

### Phase 4 — Integration Tasks `[INT]`

Write tests using the project's testing conventions:
- Backend unit tests: mock PrismaService, test service methods in isolation
- E2E tests: Playwright scripts that exercise full flows via HTTP

### Phase 5 — Verify

After implementation, verify the build:

```bash
# Rebuild backend with changes
docker compose build backend && docker compose up -d backend

# Run a smoke test — get a token and hit the new endpoints
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

# Test each new endpoint (adjust paths per sprint)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/<new-endpoint>" | jq .
```

If build fails:
1. Read the Docker build log carefully
2. Fix TypeScript errors before retrying
3. If Prisma client is stale: `docker compose run --rm migrate sh -c 'npx prisma generate'`

### Phase 6 — Update Tracking Files

After all tasks are implemented and verified:

1. **Update `TASKS.md`**: Change task status from `⬜` → `✅` for completed tasks. Change `🔄` → `✅`. Mark carried-over tasks as `⬜` with a note.

2. **Create sprint report** at `reports/sprint-<XX>.md`:
   - Copy from `reports/sprint-template.md`
   - Fill in: completed tasks, actual velocity, blockers encountered, decisions made, retrospective
   - Include verify commands specific to this sprint's features

3. **Update `deployment-status.json`**:
   - Set `_meta.updated_at` to current timestamp
   - Update `backend` module statuses for newly completed endpoints
   - Update `next_tasks` — remove completed tasks, reprioritize remaining
   - Add any new `known_issues` discovered during implementation

### Phase 7 — Git Branch, Commit & Push

After tracking files are updated, commit and push all work:

1. **Determine the base sprint branch** from git:
   ```bash
   # The current branch should already be sprint/N (or a feat branch off it)
   git branch --show-current
   ```
   - If already on `sprint/N`, create a feature branch from it.
   - If already on a `feat/...` branch, stay on it.

2. **Create a feature branch** off the current sprint branch (e.g., `sprint/3`):
   ```bash
   # Branch name pattern: feat/sprint-<N>-<short-slug>
   # Example: feat/sprint-4-network-server-ui
   git checkout -b feat/sprint-<N>-<slug>
   ```
   - `<slug>` = lowercase kebab-case summary of sprint work (e.g., `network-server-ui`, `app-group-backend`)
   - Derive it from the sprint goal in TASKS.md

3. **Stage all new and changed files** — do NOT use `git add -A`. Stage specific paths:
   ```bash
   git add packages/backend/src/modules/<new-modules>/
   git add packages/backend/src/app.module.ts
   git add packages/frontend/src/pages/<new-pages>/
   git add packages/frontend/src/hooks/
   git add packages/frontend/src/types/
   git add packages/frontend/src/components/common/
   git add packages/frontend/src/App.tsx
   git add TASKS.md deployment-status.json reports/sprint-<XX>.md
   ```

4. **Commit** with a conventional commit message:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(sprint-<N>): <Sprint goal summary — Backend + Frontend modules>

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
   - Message format: `feat(sprint-N): <description>`
   - Description = the sprint goal from TASKS.md, e.g. `Network CRUD + Server/Hardware/Network UI`

5. **Push** the feature branch to origin:
   ```bash
   git push -u origin feat/sprint-<N>-<slug>
   ```

6. **Report** the branch name and push result to the user so they can open a PR: `feat/sprint-<N>-<slug> → sprint/<N>`.

## Checklist

### Backend
- [ ] All new endpoints have Swagger `@ApiOperation` docs
- [ ] All DTOs use `@IsIn()` not `@IsEnum()`
- [ ] All list endpoints support pagination + filter + sort
- [ ] Soft delete implemented (never hard delete)
- [ ] New modules registered in `app.module.ts`
- [ ] Unit tests written for service methods
- [ ] No Prisma enum objects used as runtime values

### Frontend
- [ ] New routes added to `App.tsx`
- [ ] API hooks use TanStack Query patterns with proper cache keys
- [ ] Forms use React Hook Form + Zod validation
- [ ] Skeleton loader used (not Spinner)
- [ ] Delete actions have confirmation

### Tracking
- [ ] `TASKS.md` status updated (⬜ → ✅)
- [ ] Sprint report created in `reports/sprint-<XX>.md`
- [ ] `deployment-status.json` updated with new state

### Git
- [ ] Feature branch created: `feat/sprint-<N>-<slug>` off `sprint/<N>`
- [ ] All new/changed files staged (no `.env`, no `node_modules`)
- [ ] Commit message follows conventional commits format
- [ ] Branch pushed to origin with `-u`
- [ ] Branch name reported to user for PR creation
