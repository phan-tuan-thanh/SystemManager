Email	admin@system.local
Password	Admin@123


Toàn bộ project đã khởi tạo và chạy hoàn toàn trong Docker:

Service	URL	Status
Backend (Swagger)	http://localhost:3000/api/docs	200
Frontend	http://localhost:5173	200
PostgreSQL	localhost:5432	Healthy
Các routes đã đăng ký
POST /api/v1/auth/login — Login
POST /api/v1/auth/register — Register
POST /api/v1/auth/refresh — Refresh token
POST /api/v1/auth/logout — Logout
GET /api/v1/users — List users (Admin)
GET /api/v1/users/me — Current user profile
GET /api/v1/module-configs — List modules
PATCH /api/v1/module-configs/:key/toggle — Toggle module
GET /api/v1/audit-logs — Query audit logs
Docker commands

docker compose up -d          # Start all
docker compose down           # Stop all
docker compose logs -f        # Follow logs
docker compose up backend -d --build  # Rebuild backend
Source code được volume-mount (src/, prisma/) nên thay đổi code trên máy sẽ tự hot-reload trong container.




## Cấu trúc file

```
SystemManager/
├── CLAUDE.md                              # Instructions for Claude — đọc trước khi làm task
├── AGENTS.md                              # Agent-based workflow & loading order
├── README.md                              # (file này) Project overview & quick start
├── docs/                                  # Core documentation
│   ├── SRS.md                             # Yêu cầu hệ thống (System Requirements)
│   ├── CONVENTIONS.md                     # Quy chuẩn coding + patterns mẫu
│   ├── GUIDES.md                          # Dev guides & workflow
│   ├── IMPLEMENTATION_DETAILS.md          # Technical deep dives
│   ├── PROGRESS_LOG.md                    # Chronological project history
│   ├── plans/                             # Active sprint plans
│   └── reports/                           # Completed sprint reports
├── .ai/                                   # Agent template system (mandatory)
│   ├── agents/                            # Lane-specific rules (ba, po, tech-lead, architect, etc.)
│   ├── workflows/                         # Workflow templates (feature, bugfix, review, release, etc.)
│   ├── contracts/                         # Output guarantees & standards
│   ├── memory/                            # Shared agent knowledge (architecture, decisions, tasks)
│   ├── rules/                             # Domain-specific rules
│   ├── stack/                             # Stack definition & commands
│   └── commands.md                        # Build, test, run commands
└── .claude/                               # Claude Code IDE settings
    ├── settings.json                      # Hooks, permissions, features
    ├── settings.local.json                # Local overrides
    ├── commands/                          # Custom slash commands (skills)
    │   ├── init-project.md
    │   ├── new-module.md
    │   ├── new-page.md
    │   ├── gen-migration.md
    │   ├── gen-test.md
    │   ├── gen-api-docs.md
    │   ├── review-pr.md
    │   └── review-security.md
    └── hooks/                             # Event hooks (lint, test, security checks)
```

## Hệ thống Agent & Workflows

Để hỗ trợ collaborative work, project sử dụng **agent-based template system** (`.ai/`):

### Agent Lanes (Roles)

| Lane | File | Trách nhiệm |
|------|------|------------|
| **BA** | `.ai/agents/ba.md` | Clarification, BRD, functional spec |
| **PO** | `.ai/agents/po.md` | Epic, user story, acceptance criteria |
| **Tech Lead** | `.ai/agents/tech-lead.md` | Technical analysis, task breakdown, estimates |
| **Architect** | `.ai/agents/architect.md` | Design, API contracts, ADRs, risk assessment |
| **Senior Dev** | `.ai/agents/senior-dev.md` | Implementation, unit tests, code quality |
| **QA** | `.ai/agents/qa.md` | Test cases, regression, automation |
| **DevOps** | `.ai/agents/devops.md` | Deployment, rollback, runbooks |
| **Scrum Master** | `.ai/agents/scrum-master.md` | Sprint planning, blockers, ceremonies |
| **Orchestrator** | `.ai/agents/orchestrator.md` | Sequencing, handoffs, conflict resolution |

### Workflow Templates

| Workflow | File | Tối ưu cho |
|----------|------|-----------|
| Feature | `.ai/workflows/feature.md` | New feature implementation |
| Bugfix | `.ai/workflows/bugfix.md` | Bug fixes & patches |
| Review | `.ai/workflows/review.md` | Code reviews |
| Refactor | `.ai/workflows/refactor.md` | Refactoring & tech debt |
| Migration | `.ai/workflows/migration.md` | Database schema changes |
| Hotfix | `.ai/workflows/hotfix.md` | Production emergency fixes |
| Release | `.ai/workflows/release.md` | Release preparation & deployment |

### Mandatory Loading Order for Agents

Khi bắt đầu task, agent PHẢI load theo thứ tự này:

1. `.ai/rules/global/*` — Universal rules
2. `.ai/stack/profile.md` — What this repo is
3. `.ai/stack/conventions.md` — Repo-specific layout
4. `.ai/stack/commands.md` — Build/test/run commands
5. `.ai/contracts/*` — Output guarantees
6. `.ai/rules/domain/<relevant>` — Domain-specific rules
7. `.ai/workflows/<type>.md` — The workflow being executed
8. `.ai/memory/*` — Relevant knowledge entries
9. `.ai/agents/<role>.md` — Your lane assignment

**Không bao giờ bỏ qua loading order** — nó đảm bảo consistency giữa agents.

## Khởi động nhanh cho Developers

### Lần đầu tiên

1. Clone repo & cd vào thư mục
2. Chạy `docker compose up -d` để start backend/frontend/database
3. Chạy `npm install` trong `backend/` và `frontend/` nếu cần
4. Đọc [CLAUDE.md](CLAUDE.md) để hiểu project rules

### Workflow phát triển

| Task | Cách làm |
|------|---------|
| **Thêm feature mới** | 1. Read [AGENTS.md](AGENTS.md) & [.ai/workflows/feature.md](.ai/workflows/feature.md)<br>2. Chạy `/add-feature <name>`<br>3. Follow workflow steps |
| **Fix bug** | 1. Read [.ai/workflows/bugfix.md](.ai/workflows/bugfix.md)<br>2. Chạy `/fix/<module>-<desc>`<br>3. Create PR to sprint branch |
| **Review code** | 1. Read [.ai/workflows/review.md](.ai/workflows/review.md)<br>2. Chạy `/review-pr <PR#>`<br>3. Post review comments |
| **Scaffold module** | Chạy `/new-module <name>` — auto-creates controller, service, DTOs, tests |
| **Scaffold page** | Chạy `/new-page <name>` — auto-creates list, detail, form pages |
| **Tạo migration** | Chạy `/gen-migration <desc>` — creates & runs Prisma migration |
| **Generate tests** | Chạy `/gen-test <target>` — creates unit/integration/E2E tests |
| **Check module deps** | Chạy `/check-module-deps` — verifies dependency graph |

## Chức năng từng file chính

| File | Mục đích |
|------|---------|
| [CLAUDE.md](CLAUDE.md) | **Instructions cho Claude** — tech stack, project structure, security rules, conventions |
| [AGENTS.md](AGENTS.md) | **Agent system & workflows** — loading order, lanes, when to use each workflow |
| [docs/SRS.md](docs/SRS.md) | **System Requirements** — functional & non-functional requirements |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | **Coding patterns** — naming, structure, code samples |
| [.ai/commands.md](.ai/commands.md) | **Build/test/run commands** — exact commands for each operation |
| [.claude/settings.json](.claude/settings.json) | **IDE hooks & permissions** — auto-checks, linting, security |
