# Project Development Guides

Unified reference for development workflows, coding standards, and best practices for SystemManager.

---

## Quick Start

**First time?** Read in this order:
1. [CLAUDE.md](../CLAUDE.md) — Project rules & conventions
2. [AGENTS.md](../AGENTS.md) — Agent system & workflows
3. [docs/AGENT_SYSTEM.md](./AGENT_SYSTEM.md) — How the agent system works
4. [docs/CONVENTIONS.md](./CONVENTIONS.md) — Coding patterns

---

## 1. Agent-Based Workflow

The project uses an **agent-based template system** (`.ai/`) for structured, collaborative development.

**Key concepts:**
- **Lanes** (roles): BA, PO, Tech Lead, Architect, Senior Dev, QA, DevOps, Scrum Master
- **Workflows**: feature, bugfix, review, refactor, migration, hotfix, release
- **Mandatory loading order**: rules → stack → commands → contracts → domain rules → workflow → memory → agent lane

**Full guide:** see [docs/AGENT_SYSTEM.md](./AGENT_SYSTEM.md)

### When to Use Each Workflow

| Workflow | When | Reference |
|----------|------|-----------|
| **feature** | Implementing new feature | `.ai/workflows/feature.md` |
| **bugfix** | Fixing bugs in existing code | `.ai/workflows/bugfix.md` |
| **review** | Code review | `.ai/workflows/review.md` |
| **refactor** | Improving code quality, tech debt | `.ai/workflows/refactor.md` |
| **migration** | Database schema changes | `.ai/workflows/migration.md` |
| **hotfix** | Production emergency | `.ai/workflows/hotfix.md` |
| **release** | Production release | `.ai/workflows/release.md` |

---

## 2. Commit & Merge Guidelines

**Reference:** [.ai/contracts/commit-policy.md](../.ai/contracts/commit-policy.md)

### Standard Commit Format

Follow **conventional commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change (no bug fix, no new feature)
- `docs:` documentation only
- `test:` test code only
- `chore:` tooling, config, CI/CD

**Example:**
```
feat(server): add server lifecycle status tracking

- Add server_status field to servers table
- Add status update endpoint
- Add status change audit log

Closes #123
```

### Pull Request Workflow

1. **Create branch** from `sprint/N` (never directly from main):
   ```bash
   git checkout sprint/2
   git pull origin sprint/2
   git checkout -b feat/server-status
   ```

2. **Push and create PR**:
   ```bash
   git push -u origin feat/server-status
   gh pr create --base sprint/2 --title "feat(server): add lifecycle status"
   ```

3. **Target branch**: always `sprint/N`, never directly to `main`

4. **Merge**: when reviewed and tests pass, merge to `sprint/N`

5. **Only main is updated** when sprint is complete: `sprint/N` → `main` (one PR per sprint)

---

## 3. Coding Patterns

**Reference:** [docs/CONVENTIONS.md](./CONVENTIONS.md)

### Backend (NestJS)

- **Structure**: Modular monolith — one module per business domain
- **Naming**: 
  - Files: `module.controller.ts`, `module.service.ts`, `create-module.dto.ts`
  - Classes: `PascalCase` (e.g., `ServerService`)
  - Methods: `camelCase` (e.g., `createServer`)
  - Database: `snake_case` (e.g., `server_id`, `created_at`)

### Frontend (React)

- **Structure**: Page-based in `src/pages/`, hooks in `src/hooks/`
- **Naming**:
  - Components: `PascalCase.tsx` (e.g., `ServerList.tsx`)
  - Hooks: `useXxx.ts` (e.g., `useServers.ts`)
  - Utils: `camelCase.ts` (e.g., `formatDate.ts`)
  - Types: `camelCase.ts` (e.g., `server.ts`)

### Database (Prisma)

- **Tables**: `snake_case` plural (e.g., `servers`, `app_deployments`)
- **Columns**: `snake_case` (e.g., `server_id`, `created_at`)
- **Primary key**: `id` (UUID, auto-generated)
- **Timestamps**: `created_at`, `updated_at` (auto-managed by Prisma)
- **Soft delete**: `deleted_at` (nullable DateTime) — NEVER hard delete

---

## 4. Development Workflow

### Starting Development

```bash
# 1. Get the code
git clone <repo>
cd SystemManager

# 2. Install dependencies
npm install

# 3. Start the stack (Docker)
docker compose up -d

# 4. Verify services are running
docker compose ps
# Services: backend, frontend, postgres
```

### Running Local Commands

See [.ai/stack/commands.md](../.ai/stack/commands.md) for all commands.

```bash
# Development
npm run dev           # Backend + frontend dev server
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only

# Testing
npm test              # All tests
npm test -- --coverage  # With coverage
npm test -- --watch   # Watch mode

# Code quality
npm run lint          # Lint all
npm run format        # Format code (Prettier)
npm run build         # Production build

# Database
npm run db:push       # Sync schema to DB
npm run db:migrate    # Run migrations
npm run db:seed       # Populate seed data
npm run db:studio     # Open Prisma Studio
```

### Creating New Features

1. **Branch off sprint branch**:
   ```bash
   git checkout sprint/2
   git checkout -b feat/firewall-rules
   ```

2. **Load workflow** (read `.ai/workflows/feature.md`)

3. **Follow the workflow**:
   - Planner: understand requirements
   - Architect: design solution, API contract
   - Senior Dev: implement, write tests
   - QA: verify, regression tests
   - DevOps: deployment readiness

4. **Update memory** as you progress (`.ai/memory/active-tasks.md`)

5. **Create PR** to `sprint/2` when done

6. **Merge to main** only when sprint is complete

---

## 5. Testing Strategy

**Reference:** [.ai/contracts/test-coverage.md](../.ai/contracts/test-coverage.md)

### Backend

- **Unit tests** (`*.spec.ts`): Services, business logic, isolated
- **Integration tests**: Controllers with test database
- **E2E tests** (Playwright): Full user journeys (auth, CRUD, changeset)

Minimum coverage: 80% for critical paths

```bash
npm test -- --coverage
```

### Frontend

- **Component tests** (Vitest + Testing Library): Isolated component logic
- **E2E tests** (Playwright): User journeys, critical flows

Test files co-located: `Component.test.tsx` next to `Component.tsx`

---

## 6. Deployment & Environment

### Local Development

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Swagger API docs: `http://localhost:3000/api/docs`
- Database: PostgreSQL on `localhost:5432`

### Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop all
docker compose down

# Rebuild backend
docker compose up backend --build -d

# Clean rebuild (fresh database)
docker compose down -v
docker compose up -d
```

### Environment Variables

Configured in `docker-compose.yml` for local dev. For production, see deployment runbooks (`.ai/workflows/release.md`).

---

## 7. Debugging

### Backend Debugging

1. Open `http://localhost:3000/api/docs` (Swagger)
2. Use TypeScript strict mode — errors caught at compile time
3. Check logs: `docker compose logs -f backend`

### Frontend Debugging

1. Open DevTools (F12)
2. Check Network tab for API calls
3. Check Console for errors
4. Use React DevTools extension

### Database Debugging

```bash
# Open Prisma Studio (visual DB browser)
npm run db:studio
# Opens on http://localhost:5555
```

---

## 8. Common Tasks

| Task | How | Command |
|------|-----|---------|
| Add new NestJS module | Use agent system workflow | `feat/<module>` branch |
| Add new React page | Create folder in `src/pages/` | Follow CONVENTIONS.md |
| Create DB migration | Update schema.prisma, migrate | `npx prisma migrate dev` |
| Run tests | Jest with coverage | `npm test -- --coverage` |
| Format code | Prettier (auto on save) | `npm run format` |
| Check types | TypeScript strict | `npm run type-check` |
| Deploy | DevOps workflow | `.ai/workflows/release.md` |

---

## 9. Git Workflows

### Sprint Branching

```
main (stable)
  ↑
  └← sprint/2 (integration branch)
      ├← feat/firewall-rules (feature branch)
      ├← fix/auth-token (bug fix)
      └← chore/deps (tooling)
```

**Rules:**
1. `main` is always production-ready
2. `sprint/N` is the integration target for the sprint
3. Feature/fix branches branch off `sprint/N`, PR back to `sprint/N`
4. Only merge `sprint/N` → `main` when sprint is complete

### Hotfixes

For production emergencies that can't wait for sprint:

```
main
  ↑
  └← fix/hotfix-login-crash
      ├→ main (urgent fix)
      └→ sprint/2 (back-port)
```

Then continue sprint/2 normally.

---

## 10. Code Review Checklist

**Reference:** [.ai/contracts/pr-checklist.md](../.ai/contracts/pr-checklist.md)

- [ ] Code follows conventions (CONVENTIONS.md)
- [ ] Tests added/updated
- [ ] Commit messages follow conventional commits
- [ ] No console.log / debug code left
- [ ] No security issues (OWASP Top 10)
- [ ] API design matches contract (.ai/contracts/api-design.md)
- [ ] No breaking changes without discussion
- [ ] Documentation updated if needed
- [ ] Performance impact assessed (if applicable)

---

See [AGENT_SYSTEM.md](./AGENT_SYSTEM.md) for the full agent system guide, or [CLAUDE.md](../CLAUDE.md) for Claude-specific instructions.
