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
├── CLAUDE.md                              # Rules chính — Claude Agent đọc file này đầu tiên
├── docs/
│   ├── SRS.md                             # (đã có) Yêu cầu hệ thống
│   └── CONVENTIONS.md                     # Quy chuẩn coding chi tiết + patterns mẫu
└── .claude/
    ├── settings.json                      # Hooks tự động (lint khi edit, cảnh báo security)
    └── commands/                           # Custom slash commands (skills)
        ├── init-project.md                # /init-project — Bootstrap toàn bộ project
        ├── new-module.md                  # /new-module <name> — Scaffold NestJS module
        ├── new-page.md                    # /new-page <name> — Scaffold React page
        ├── gen-migration.md               # /gen-migration <desc> — Tạo DB migration
        ├── gen-test.md                    # /gen-test <target> — Generate unit/integration tests
        ├── gen-api-docs.md                # /gen-api-docs <module> — Swagger docs
        ├── review-pr.md                   # /review-pr <PR> — Code review toàn diện
        ├── review-security.md             # /review-security <target> — Audit bảo mật
        ├── check-module-deps.md           # /check-module-deps — Kiểm tra dependency graph
        └── audit-check.md                # /audit-check <module> — Kiểm tra audit log compliance
```

## Chức năng từng file

| File                                                                                                              | Mục đích                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [CLAUDE.md](vscode-webview://1pc95ij2j36v761gr126akhdj4dvikcpvqfhg76up4tbc0k4fsil/CLAUDE.md)                         | **Rules chính** — tech stack, project structure, module architecture, DB/API conventions, security rules, testing strategy, git workflow. Claude Agent tự động đọc file này mỗi session |
| [.claude/settings.json](vscode-webview://1pc95ij2j36v761gr126akhdj4dvikcpvqfhg76up4tbc0k4fsil/.claude/settings.json) | **Hooks** — tự động nhắc security khi edit code, auto-lint TypeScript, reminder chạy test sau commit                                                                                       |
| [docs/CONVENTIONS.md](vscode-webview://1pc95ij2j36v761gr126akhdj4dvikcpvqfhg76up4tbc0k4fsil/docs/CONVENTIONS.md)     | **Coding patterns** — naming convention bảng tham chiếu, code mẫu cho Controller/Service/DTO/Hook/Component                                                                                  |
| `/init-project`                                                                                                 | Bootstrap monorepo từ đầu (NestJS + React + Docker + Prisma)                                                                                                                                        |
| `/new-module`                                                                                                   | Tạo NestJS module mới đầy đủ cấu trúc (controller, service, dto, entity, tests)                                                                                                                |
| `/new-page`                                                                                                     | Tạo React page mới (list, detail, form, filter, API hooks)                                                                                                                                           |
| `/gen-migration`                                                                                                | Tạo Prisma migration theo đúng conventions                                                                                                                                                          |
| `/gen-test`                                                                                                     | Generate tests cho backend service/controller hoặc frontend component                                                                                                                                 |
| `/review-security`                                                                                              | Audit bảo mật theo OWASP Top 10                                                                                                                                                                      |
| `/review-pr`                                                                                                    | Review PR toàn diện (architecture, code quality, security, testing)                                                                                                                                  |
| `/check-module-deps`                                                                                            | Kiểm tra dependency graph module theo SRS                                                                                                                                                             |
| `/audit-check`                                                                                                  | Verify audit log coverage cho từng module                                                                                                                                                             |

Khi bắt đầu dev, chạy `/init-project` để scaffold toàn bộ project, sau đó dùng `/new-module server` và `/new-page server` để tạo từng module theo Phase 1.
