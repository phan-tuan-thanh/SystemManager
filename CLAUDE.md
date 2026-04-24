# SystemManager — Infrastructure & Deployment Management System

## Project Overview

Hệ thống quản lý hạ tầng server & ứng dụng triển khai. Quản lý tập trung server, ứng dụng, network, topology kết nối theo từng môi trường (DEV/UAT/PROD).

- **SRS**: [docs/SRS.md](docs/SRS.md)
- **Architecture**: Modular monolith — mỗi module độc lập về data, UI, API
- **Environments**: DEV / UAT / PROD
- **Roles**: ADMIN / OPERATOR / VIEWER (fixed RBAC)

## Tech Stack

### Backend
- **Runtime**: Node.js (LTS) + TypeScript (strict mode)
- **Framework**: NestJS — modular architecture mapping 1:1 with business modules
- **ORM**: Prisma — type-safe database access, migrations
- **Database**: PostgreSQL 15+
- **API**: REST (OpenAPI/Swagger) + GraphQL (Apollo Server with subscriptions)
- **Auth**: JWT (access + refresh token rotation), Passport.js
- **Validation**: class-validator + class-transformer
- **File Storage**: Local disk (dev) / S3-compatible (prod) for deployment documents

### Frontend
- **Framework**: React 18+ with TypeScript (strict)
- **Build**: Vite
- **State**: Zustand (global) + TanStack Query (server state)
- **UI Library**: Ant Design (antd) — phù hợp enterprise admin
- **Routing**: React Router v6+
- **GraphQL Client**: Apollo Client (for subscriptions)
- **2D Topology**: React Flow or D3.js
- **3D Topology**: React Three Fiber (Three.js)
- **Forms**: React Hook Form + Zod validation

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Linting**: ESLint + Prettier (shared config)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Project Structure

```
SystemManager/
├── CLAUDE.md                    # This file — project rules for Claude Agent
├── docs/                        # Project Documentation
│   ├── plans/                   # Active implementation plans (Sprint 10+)
│   ├── SRS.md                   # System Requirements Specification
│   ├── CONVENTIONS.md           # Coding standards & Patterns
│   ├── IMPLEMENTATION_DETAILS.md # Archived technical plans & feature specs
│   ├── PROGRESS_LOG.md          # Chronological record of project updates
│   ├── GUIDES.md                # Development & Workflow guides
│   └── reports/                 # Sprint reports archive
├── TASKS.md                     # Agile task list
├── AGENTS.md                    # Agent-specific instructions
├── deployment-status.json        # Unified project state snapshot
│   ├── backend/                 # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema
│   │   │   └── migrations/      # Prisma migrations
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/          # Shared: guards, decorators, pipes, filters
│   │   │   │   ├── guards/      # AuthGuard, RolesGuard
│   │   │   │   ├── decorators/  # @Roles(), @CurrentUser(), @Public()
│   │   │   │   ├── pipes/       # ValidationPipe config
│   │   │   │   ├── filters/     # Global exception filters
│   │   │   │   ├── interceptors/# AuditLog interceptor, Transform interceptor
│   │   │   │   └── dto/         # Shared DTOs (pagination, filter, sort)
│   │   │   └── modules/
│   │   │       ├── auth/        # Authentication (local + Microsoft 365)
│   │   │       ├── user/        # User management
│   │   │       ├── user-group/  # UserGroup management
│   │   │       ├── module-config/ # Module on/off management
│   │   │       ├── server/      # Server management
│   │   │       ├── hardware/    # Hardware inventory
│   │   │       ├── network/     # Network configuration
│   │   │       ├── app-group/   # Application groups
│   │   │       ├── application/ # Business applications + System software
│   │   │       ├── deployment/  # AppDeployment + DeploymentDoc
│   │   │       ├── port/        # Port management
│   │   │       ├── connection/  # AppConnection
│   │   │       ├── topology/    # Topology queries, GraphQL subscriptions
│   │   │       ├── changeset/   # ChangeSet draft & preview
│   │   │       ├── snapshot/    # Topology snapshots
│   │   │       └── audit/       # Audit log & Change history
│   │   └── test/                # E2E tests
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── api/             # API client (axios instance, react-query hooks)
│       │   ├── graphql/         # GraphQL queries, mutations, subscriptions
│       │   ├── stores/          # Zustand stores
│       │   ├── hooks/           # Shared custom hooks
│       │   ├── components/      # Shared UI components
│       │   │   ├── layout/      # AppLayout, Sidebar, Header
│       │   │   └── common/      # DataTable, FilterBar, StatusBadge...
│       │   ├── pages/           # Page components (1 folder per module)
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── admin/       # User mgmt, UserGroup, Module config
│       │   │   ├── server/
│       │   │   ├── hardware/
│       │   │   ├── network/
│       │   │   ├── application/
│       │   │   ├── deployment/
│       │   │   ├── topology/
│       │   │   ├── changeset/
│       │   │   └── audit/
│       │   ├── types/           # TypeScript interfaces/types
│       │   └── utils/           # Helper functions
│       └── test/                # Component + E2E tests
├── docker-compose.yml
├── .env.example
└── package.json                 # Root workspace config
```

## Module Architecture Rules

### Each NestJS Module MUST contain:
```
modules/<module-name>/
├── <module-name>.module.ts       # NestJS module definition
├── <module-name>.controller.ts   # REST endpoints
├── <module-name>.service.ts      # Business logic
├── <module-name>.resolver.ts     # GraphQL resolver (if needed)
├── dto/
│   ├── create-<name>.dto.ts      # Create DTO with validation
│   ├── update-<name>.dto.ts      # Update DTO (PartialType)
│   └── query-<name>.dto.ts       # Filter/pagination DTO
├── entities/
│   └── <name>.entity.ts          # Response entity (NOT Prisma model)
└── __tests__/
    ├── <name>.controller.spec.ts
    └── <name>.service.spec.ts
```

### Module Rules:
1. **No cross-module service injection** — modules communicate via well-defined interfaces or events
2. **Each module registers its own routes** — prefix: `/api/v1/<module-name>`
3. **Audit logging is automatic** — via global AuditLogInterceptor, no manual logging in services
4. **Module availability check** — ModuleGuard checks if module is ENABLED before processing request
5. **All list endpoints support**: pagination (`page`, `limit`), sorting (`sortBy`, `sortOrder`), filtering

## Database Conventions

### Prisma Schema:
- Table names: `snake_case` plural (e.g., `servers`, `app_deployments`)
- Column names: `snake_case` (e.g., `created_at`, `server_id`)
- Primary key: `id` (UUID, auto-generated)
- Timestamps: every table has `created_at`, `updated_at` (auto-managed)
- Soft delete: use `deleted_at` (nullable DateTime) — NEVER hard delete user-facing data
- Enums: UPPER_SNAKE_CASE (e.g., `ACTIVE`, `INACTIVE`, `MAINTENANCE`)
- Foreign keys: `<entity>_id` (e.g., `server_id`, `application_id`)
- Indexes: add for all foreign keys and commonly filtered fields

### Migration Rules:
- One migration per logical change
- Migration name: descriptive (e.g., `add_deployment_docs_table`)
- NEVER edit existing migrations — create new ones
- Always include both up and down logic

## API Conventions

### REST API:
- Base path: `/api/v1`
- Resource naming: kebab-case, plural (e.g., `/api/v1/servers`, `/api/v1/app-deployments`)
- Standard responses:
  ```json
  // Success (single)
  { "data": { ... }, "message": "OK" }
  
  // Success (list)
  { "data": [...], "meta": { "total": 100, "page": 1, "limit": 20 } }
  
  // Error
  { "error": { "code": "RESOURCE_NOT_FOUND", "message": "..." } }
  ```
- HTTP methods: GET (read), POST (create), PATCH (partial update), DELETE (soft delete)
- Status codes: 200 (OK), 201 (Created), 400 (Validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict)

### GraphQL:
- Schema-first approach for Topology module
- Queries for read operations, Mutations for writes
- Subscriptions only for realtime status (topology, server status, connection status)
- Use DataLoader pattern to avoid N+1 queries

## Auth & Security Rules

- **Every endpoint** is protected by default (use `@Public()` decorator to opt-out)
- **Role check**: use `@Roles(Role.ADMIN)` or `@Roles(Role.ADMIN, Role.OPERATOR)` decorator
- **Module check**: `@RequireModule('SERVER_MGMT')` decorator ensures module is enabled
- **Passwords**: bcrypt with salt rounds = 12
- **JWT access token**: 15 minutes expiry
- **JWT refresh token**: 7 days, rotate on use, stored in DB
- **Sensitive fields** (password, tokens, secrets): NEVER include in API response or audit log values
- **File upload**: validate MIME type, max size 20MB, allowed: `.pdf`, `.docx`, `.xlsx`
- **Input sanitization**: strip HTML tags from all string inputs
- **SQL injection**: Prisma handles this — NEVER use raw queries unless absolutely necessary

## Audit Log Rules

- **AuditLogInterceptor** automatically logs all mutating operations (POST, PATCH, DELETE)
- Log format: `{ userId, action, resourceType, resourceId, oldValue, newValue, ip, userAgent, result }`
- `oldValue` and `newValue` are JSON snapshots — exclude sensitive fields
- Failed operations (validation, forbidden) are also logged with `result: 'FAILED'`
- Read operations are NOT logged (except `VIEW_SENSITIVE` for specific fields)

## Application Logging Rules

### Backend (NestJS)
- **Always log to BOTH console and file simultaneously** — no logging-only-to-one-target
- Use NestJS built-in `Logger` + `winston` transport: `ConsoleTransport` + `DailyRotateFileTransport`
- Log levels (in order): `error`, `warn`, `log` (info), `debug`, `verbose`
- Log file location: `logs/app-YYYY-MM-DD.log` (daily rotation, max 30 days retention)
- Log format: JSON structured — `{ timestamp, level, context, message, ...meta }`
- **Log config is runtime-controlled** via `SystemConfig` table in DB — NEVER require restart to change log level
- `SystemConfig` keys for logging:
  - `LOG_ENABLED` — boolean, master switch (default: `true`)
  - `LOG_LEVEL` — enum `error|warn|log|debug|verbose` (default: `log`)
  - `LOG_TO_FILE` — boolean (default: `true`)
  - `LOG_TO_CONSOLE` — boolean (default: `true`)
- Backend reads logging config on startup and re-reads on each `PATCH /api/v1/admin/system-config` call — no restart needed
- Sensitive fields (passwords, tokens) MUST be redacted before logging — use `[REDACTED]` placeholder
- HTTP request/response logging: method, path, status, duration — controlled by `LOG_LEVEL >= log`

### Frontend
- **Always log to console** — use a thin wrapper `logger.ts` over `console.*`
- In production, suppress `debug` and `verbose` level logs automatically
- Frontend does NOT write to files — browser limitation; structured logs are sent to backend `/api/v1/admin/client-logs` endpoint (batched, fire-and-forget)
- Frontend log levels mirror backend: `error`, `warn`, `info`, `debug`
- `logger.ts` reads log level from global app config (fetched at app startup from `/api/v1/admin/system-config`)
- NEVER `console.log` directly in component code — always use `logger.*`

### Admin UI (Log Settings page)
- Route: `/admin/system-config` → "Logging" section
- Fields exposed to ADMIN role:
  - Master enable/disable toggle (`LOG_ENABLED`)
  - Log level selector: `error / warn / info / debug / verbose`
  - File logging toggle (`LOG_TO_FILE`)
  - Console logging toggle (`LOG_TO_CONSOLE`)
- Changes take effect immediately (optimistic update + PATCH to backend)
- Non-ADMIN roles: read-only view of current log level, no controls shown

## DateTime & Format Standards

- **Date format**: `yyyy-MM-dd` (e.g., `2024-04-24`)
- **Time format**: `HH:mm` (e.g., `14:30`) or `HH:mm:ss` if seconds are required.
- **Timezone**: Use UTC for storage and database; convert to local time only at the UI layer.
- **Library**: Use `dayjs` for formatting and manipulation on both backend and frontend.

## Frontend Conventions

### File Naming:
- Components: `PascalCase.tsx` (e.g., `ServerList.tsx`, `TopologyView.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useServers.ts`, `useAuth.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `camelCase.ts` (e.g., `server.ts`, `deployment.ts`)
- API hooks: `use<Resource>.ts` (e.g., `useServers.ts` exports `useServerList`, `useServerDetail`, `useCreateServer`)

### Component Structure:
```tsx
// pages/server/ServerList.tsx
// 1. Imports (external → internal → types → styles)
// 2. Type definitions (if component-specific)
// 3. Component function (named export)
// 4. Sub-components (if small and tightly coupled)
```

### State Management:
- **Server state**: TanStack Query (useQuery, useMutation) — single source of truth for API data
- **Global UI state**: Zustand (sidebar, theme, active module)
- **Form state**: React Hook Form — do NOT lift form state to global store
- **URL state**: React Router searchParams for filters, pagination

### UI Patterns:
- **DataTable**: reusable table with built-in pagination, sorting, filtering
- **Page layout**: consistent `PageHeader` + content area + optional side panel
- **Loading**: Skeleton loaders, NOT spinners
- **Error**: Error boundary per page, toast for action errors
- **Confirmation**: Modal confirm for destructive actions (delete, apply changeset)
- **Responsive**: Desktop-first (min-width: 1280px), admin tool — mobile not required

## Testing Strategy

### Backend:
- Unit tests for services (mock Prisma client)
- Integration tests for controllers (use test database)
- E2E tests for critical flows: auth, CRUD operations, changeset workflow
- Test naming: `describe('<MethodName>') → it('should <expected behavior>')`

### Frontend:
- Component tests with Vitest + Testing Library
- E2E tests with Playwright for critical user journeys
- Test files co-located: `ComponentName.test.tsx` next to `ComponentName.tsx`

## Git Conventions

### Branch Strategy

```
main          ← stable, production-ready — NEVER commit directly
└── sprint/N  ← sprint integration branch, branched from main
    ├── feat/<module>-<description>   ← feature work
    ├── fix/<module>-<description>    ← bug fixes
    └── chore/<description>           ← tooling, config, docs
```

#### Rules for Sprint branches

1. **Always create a sprint branch before starting any sprint work**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b sprint/2          # sprint/N where N is sprint number
   git push -u origin sprint/2
   ```

2. **Sprint branch is the integration target** — all feature/fix branches for that sprint branch off `sprint/N` and PR back into `sprint/N`, NOT into `main`

3. **Feature branches are short-lived** — one branch per module or logical unit; merge back to `sprint/N` as soon as it is working and reviewed

4. **`main` is only updated via Sprint PR** — when a sprint is complete and tested, open one PR: `sprint/N → main`. Squash-merge or rebase to keep `main` history clean

5. **Never push directly to `main`** — all changes to `main` must go through a `sprint/N` PR

6. **Hotfixes** (urgent production bugs) branch off `main` directly: `fix/hotfix-<description>`, then PR into both `main` and the active `sprint/N`

#### Naming conventions

| Type | Pattern | Example |
|------|---------|---------|
| Sprint branch | `sprint/N` | `sprint/2` |
| Feature | `feat/<module>-<description>` | `feat/server-crud` |
| Bug fix | `fix/<module>-<description>` | `fix/auth-token-refresh` |
| Hotfix | `fix/hotfix-<description>` | `fix/hotfix-login-crash` |
| Chore | `chore/<description>` | `chore/update-deps` |

### Commit Messages

- Format: conventional commits — `feat(server): add CRUD endpoints`, `fix(auth): token refresh race condition`
- PR per module or per feature — keep PRs focused
- NEVER commit `.env`, credentials, `.secrets/`, or `node_modules`

### Sprint Completion Checklist (before merging sprint/N → main)

- [ ] All feature branches merged into `sprint/N`
- [ ] Docker Compose full rebuild passes (`docker-compose down -v && docker-compose up -d`)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Sprint report written to `reports/sprint-NN.md`
- [ ] PR opened: `sprint/N → main` with summary of changes

## Important Implementation Notes

1. **Module dependency check**: When enabling a module, verify all dependencies are ENABLED first (see SRS section 4.0b)
2. **Soft delete everywhere**: Set `deleted_at` instead of removing rows — audit trail must be preserved
3. **Environment isolation**: Data queries should ALWAYS filter by environment unless explicitly showing cross-env view
4. **ChangeSet workflow**: Draft changes do NOT affect live data — only `APPLIED` changesets modify production state
5. **Topology snapshots**: Auto-create after every ChangeSet apply, store as JSON payload
6. **Port conflict detection**: Check same server + same port + same protocol before allowing creation
7. **IP conflict detection**: Check same environment + same IP before allowing creation
8. **File upload for DeploymentDoc**: Preview can be docx/xlsx/pdf, Final MUST be PDF only

## Phase Priorities
 
- **Phase 4 (Current)**: UX Polish & Maintenance (Sprint 15). Focus: Server data enrichment, simplified import, and interactive topology refinements.
- **Phase 3 (Done)**: SSO, Performance, & Alerts.
- **Phase 2 (Done)**: Topology 2D/3D, ChangeSet, Snapshots.
- **Phase 1 (Done)**: Core CRUD (Auth, Server, App, etc.).
