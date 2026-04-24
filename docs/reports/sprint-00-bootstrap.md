# Sprint 0 — Bootstrap & Infrastructure

**Ngày bắt đầu:** 2026-04-07  
**Ngày kết thúc:** 2026-04-07  
**Sprint Goal:** Scaffold toàn bộ monorepo, Docker environment, Auth flow hoàn chỉnh, Setup Wizard với demo data  
**Trạng thái:** ✅ DONE

---

## Sprint Goal

> Xây dựng nền tảng kỹ thuật cho hệ thống: monorepo NestJS + React chạy hoàn toàn trong Docker (không cài local), có thể đăng nhập, khởi tạo hệ thống qua wizard, và seed dữ liệu demo thực tế.

---

## Completed Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S0-01 | `[BE]` NestJS monorepo scaffold (workspaces, tsconfig, nest-cli) | 3 | ✅ |
| S0-02 | `[BE]` Prisma schema — tất cả 20 models, 16 enums | 5 | ✅ |
| S0-03 | `[BE]` Prisma migrations (init + business models) | 2 | ✅ |
| S0-04 | `[BE]` Global guards: JwtAuthGuard, RolesGuard | 3 | ✅ |
| S0-05 | `[BE]` Global decorators: @Public, @Roles, @CurrentUser, @RequireModule | 2 | ✅ |
| S0-06 | `[BE]` Auth module: login, refresh, logout (JWT + bcrypt) | 5 | ✅ |
| S0-07 | `[BE]` System module: /system/status, /system/initialize, /system/seed-demo | 5 | ✅ |
| S0-08 | `[BE]` Demo data seeder (8 servers, 4 apps, 10 deployments, hardware, network) | 5 | ✅ |
| S0-09 | `[BE]` AuditLogInterceptor (auto-log POST/PATCH/DELETE) | 3 | ✅ |
| S0-10 | `[BE]` User module: GET /users, GET /users/me, GET /users/:id | 2 | ✅ |
| S0-11 | `[BE]` Audit module: GET /audit-logs (filter + pagination) | 2 | ✅ |
| S0-12 | `[BE]` ModuleConfig module: list + toggle | 2 | ✅ |
| S0-13 | `[BE]` Seed script: admin user + 17 modules + 5 user groups | 2 | ✅ |
| S0-14 | `[FE]` React + Vite setup, Ant Design, TanStack Query, Zustand | 3 | ✅ |
| S0-15 | `[FE]` Axios client với JWT interceptor + refresh token flow | 3 | ✅ |
| S0-16 | `[FE]` Auth store (Zustand persisted), Login page | 3 | ✅ |
| S0-17 | `[FE]` Setup Wizard (3-step: Welcome → Config → Done) với demo data toggle | 5 | ✅ |
| S0-18 | `[FE]` App router với ProtectedRoute + system status redirect | 3 | ✅ |
| S0-19 | Docker Compose: db + backend + frontend + migrate services | 3 | ✅ |
| S0-20 | Vite proxy to backend container (process.env.BACKEND_URL) | 1 | ✅ |

**Actual Velocity:** 62 points

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp |
|---|---|---|
| 401 on login | DB empty — không có user seed | Tạo prisma/seed.ts, chạy via Docker |
| ECONNREFUSED Vite proxy | Frontend container dùng `localhost:3000` (trỏ vào chính mình) | `BACKEND_URL=http://backend:3000` qua env + vite.config.ts |
| Setup redirect không hoạt động | `useSystemStatus` dùng `data.data` nhưng API trả flat JSON | Sửa hook để dùng `data` trực tiếp |
| `ReferenceError: ServerPurposeEnum` | IDE linter tự rewrite `demo-data.ts` thay string literals bằng broken enum objects | Rewrite toàn bộ file dùng `'VALUE' as const` |
| `ReferenceError: UserStatus` | Linter replace Prisma import với type alias rồi dùng như runtime value trong @IsEnum() | Dùng `const STATUSES = [...] as const` + `@IsIn()` |
| MockPrismaClient replace PrismaClient | IDE linter thay thế `extends PrismaClient` bằng 200-line mock class | Restore `import { PrismaClient }` từ @prisma/client |
| Table `module_configs` không tồn tại | Docker pgdata volume bị reset | Chạy `prisma migrate deploy` + seed lại |

---

## Key Decisions

1. **Docker-only development**: không cài node_modules local — tất cả chạy trong container. Lý do: user requirement và tránh dependency conflicts.

2. **String literals thay vì Prisma enums**: dùng `'ADMIN'` thay `Role.ADMIN` ở decorators và `@IsIn([...] as const)` thay `@IsEnum(EnumName)` vì IDE linter có thể phá vỡ Prisma imports khi node_modules không có local.

3. **AuditLogInterceptor registered qua AuditModule**: dùng `APP_INTERCEPTOR` trong AuditModule providers thay vì register global trong main.ts — giữ module tự chứa.

4. **System status check dùng staleTime: Infinity**: useSystemStatus chỉ fetch 1 lần per session vì initialized state không thay đổi sau setup.

5. **Demo data idempotent check**: seedDemoData() throws ConflictException nếu đã có servers — tránh duplicate seeding.

---

## Achievements

- ✅ Docker Compose chạy 4 services (db, migrate, backend, frontend) với hot-reload
- ✅ Prisma schema đầy đủ 20 models cho toàn bộ business domain
- ✅ JWT auth hoàn chỉnh: login → access token → refresh → logout
- ✅ Setup Wizard hoạt động: detect uninitialized → redirect → initialize → optional demo seed
- ✅ Demo data thực tế: 8 servers (DEV/UAT/PROD/DR), 4 apps, 10 deployments, hardware + network đầy đủ
- ✅ Swagger UI accessible tại `/api/docs`
- ✅ AuditLogInterceptor tự động log mọi POST/PATCH/DELETE
- ✅ `deployment-status.json` làm AI handoff document

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | ~60 | 62 |
| Tasks Completed | 20 | 20 |
| Tasks Carried Over | 0 | 0 |
| Critical Bugs Fixed | — | 7 (IDE linter issues) |
| Docker Services Running | 4 | 4 |
| Prisma Models | 20 | 20 |
| API Endpoints Live | ~10 | 12 |

---

## Demo / Verify

```bash
# Start toàn bộ hệ thống
cd /Users/ptud/Documents/Labs/SystemManager
docker compose up -d

# Chờ migrate xong rồi seed
docker compose run --rm migrate sh -c 'npx prisma migrate deploy && npx ts-node prisma/seed.ts'

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}'

# Frontend
open http://localhost:5173
# → Login với admin@system.local / Admin@123
# → Redirect đến /setup nếu chưa initialized
# → Complete wizard với demo data toggle ON
```

---

## Known Issues Carried Over

| ID | Issue | Severity | Sprint Fix Target |
|---|---|---|---|
| ISSUE-001 | Response format không chuẩn (thiếu TransformInterceptor global) | Medium | Sprint 1 |
| ISSUE-002 | GlobalExceptionFilter chưa registered — error responses không chuẩn | Medium | Sprint 1 |
| ISSUE-003 | User module thiếu POST/PATCH/role management | High | Sprint 1 |
| ISSUE-004 | IDE linter tự rewrite files khi mở (node_modules không local) | Low | Cần workaround mỗi session |

---

## Retrospective

### What went well
- Tiến độ nhanh: toàn bộ foundation trong 1 session
- Demo data realistic và đủ để test các tính năng downstream
- Docker-only approach hoạt động tốt cho development

### What could be improved
- IDE linter issue gây mất nhiều thời gian debug — cần document rõ hơn
- Cần thêm unit tests ngay từ đầu (hiện tại chưa có tests)
- GlobalExceptionFilter và TransformInterceptor nên register ngay từ đầu

### Action items for Sprint 1
- [ ] Register GlobalExceptionFilter + TransformInterceptor trong main.ts
- [ ] Viết unit tests cho AuthService, UserService
- [ ] Complete User CRUD (POST, PATCH, role management)
- [ ] Complete UserGroup CRUD + member management

---

## Next Sprint Preview

**Sprint 1 Goal:** Hoàn thiện User và UserGroup management backend (CRUD đầy đủ, role assignment, member management)  
**Key tasks:**
- POST /users, PATCH /users/:id, POST /auth/change-password
- UserGroup CRUD + bulk member management
- Effective role resolution (union of direct + group roles)
- GlobalExceptionFilter + TransformInterceptor

---

_Report tạo bởi: Claude Code Agent (claude-opus-4-6)_  
_Ngày: 2026-04-07_
