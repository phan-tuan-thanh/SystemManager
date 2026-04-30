# SystemManager — Agile Task List & Sprint Plan

> **Trạng thái hiện tại:** Sprint 18 ✅ DONE — Multi-Port, Connection Import & UI Consolidation

---

## Quy ước

| Ký hiệu | Ý nghĩa |
|---|---|
| `[BE]` | Backend task |
| `[FE]` | Frontend task |
| `[INT]` | Integration / E2E test |
| `✅` | Hoàn thành |
| `🔄` | Đang thực hiện |
| `⬜` | Chưa bắt đầu |
| `🚧` | Blocked / cần unblock trước |

**Story Point scale:** 1 = trivial, 2 = simple, 3 = medium, 5 = complex, 8 = very complex

---

## Sprint 0 — Bootstrap & Infrastructure ✅ DONE

**Mục tiêu:** Scaffolding monorepo, Docker environment, Auth, Setup Wizard  
**Thời gian:** Completed 2026-04-07  
**Report:** [docs/reports/sprint-00-bootstrap.md](docs/reports/sprint-00-bootstrap.md)

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

---

## Sprint 1 — User & UserGroup Management (Backend) ✅ DONE

**Mục tiêu:** Hoàn thiện backend CRUD cho User và UserGroup  
**Thời gian:** Sprint 1 (2026-04-08 → 2026-04-09)  
**Report:** [docs/reports/sprint-01.md](docs/reports/sprint-01.md)

### Backend Tasks

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S1-01 | `[BE]` POST /users — tạo local user (ADMIN only), hash password | 3 | ✅ | 4.0.2 |
| S1-02 | `[BE]` PATCH /users/:id — cập nhật full_name, status, avatar | 2 | ✅ | 4.0.2 |
| S1-03 | `[BE]` POST /users/:id/roles — gán role cho user | 2 | ✅ | 4.0.2 |
| S1-04 | `[BE]` DELETE /users/:id/roles/:role — gỡ role khỏi user | 2 | ✅ | 4.0.2 |
| S1-05 | `[BE]` POST /auth/change-password — đổi mật khẩu (self) | 2 | ✅ | 4.0.1 |
| S1-06 | `[BE]` POST /users/:id/reset-password — reset mật khẩu (ADMIN) | 2 | ✅ | 4.0.2 |
| S1-07 | `[BE]` GET /users/:id/login-history — lịch sử đăng nhập | 2 | ✅ | 4.0.2 |
| S1-08 | `[BE]` UserGroup CRUD: GET, POST, PATCH, DELETE | 5 | ✅ | 4.0.3 |
| S1-09 | `[BE]` GET /user-groups/:id/members — danh sách thành viên | 2 | ✅ | 4.0.3 |
| S1-10 | `[BE]` POST /user-groups/:id/members — thêm members hàng loạt | 3 | ✅ | 4.0.3 |
| S1-11 | `[BE]` DELETE /user-groups/:id/members — gỡ members hàng loạt | 2 | ✅ | 4.0.3 |
| S1-12 | `[BE]` Effective role resolution: union của direct roles + group roles | 3 | ✅ | 4.0.4 |
| S1-13 | `[BE]` GlobalExceptionFilter — chuẩn hoá error response format | 2 | ✅ | API Conv |
| S1-14 | `[BE]` TransformInterceptor — chuẩn hoá success response `{data, meta}` | 2 | ✅ | API Conv |

**Sprint 1 Total: 32 points**

### Definition of Done Sprint 1
- [x] Tất cả endpoints có Swagger documentation
- [x] Validation DTOs đầy đủ (class-validator)
- [x] Unit tests cho UserService và UserGroupService
- [x] Response format chuẩn `{data, meta}` cho list, `{data}` cho single

---

## Sprint 2 — User & UserGroup Frontend ✅ DONE

**Mục tiêu:** Trang quản lý User và UserGroup trong khu vực Admin  
**Thời gian:** Sprint 2 (2026-04-09)  
**Report:** [docs/reports/sprint-02.md](docs/reports/sprint-02.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S2-01 | `[FE]` AppLayout: Sidebar, Header, breadcrumb, notification bell | 5 | ✅ | 6 |
| S2-02 | `[FE]` Dashboard tổng quan: counters, quick links | 3 | ✅ | 6 |
| S2-03 | `[FE]` Admin → Users page: DataTable với filter + pagination | 5 | ✅ | 4.0.2 |
| S2-04 | `[FE]` Admin → Users: Create user modal (form + validation) | 3 | ✅ | 4.0.2 |
| S2-05 | `[FE]` Admin → Users: Edit user drawer (status, name, avatar) | 3 | ✅ | 4.0.2 |
| S2-06 | `[FE]` Admin → Users: Assign role, reset password actions | 3 | ✅ | 4.0.2 |
| S2-07 | `[FE]` Admin → Users: Login history modal | 2 | ✅ | 4.0.2 |
| S2-08 | `[FE]` Admin → UserGroups page: CRUD table | 5 | ✅ | 4.0.3 |
| S2-09 | `[FE]` Admin → UserGroups: Member management modal (bulk add/remove) | 5 | ✅ | 4.0.3 |
| S2-10 | `[FE]` Admin → Modules page: Core/Extended phân nhóm, toggle | 5 | ✅ | 4.0b |
| S2-11 | `[FE]` Admin → Modules: Dependency check modal, cascade confirm | 3 | ✅ | 4.0b |
| S2-12 | `[FE]` User profile page: đổi mật khẩu, xem thông tin bản thân | 3 | ✅ | 4.0.1 |
| S2-13 | `[FE]` TanStack Query hooks: useUsers, useUserGroups, useModuleConfigs | 3 | ✅ | — |

**Sprint 2 Total: 48 points**

---

## Sprint 3 — Server & Hardware Backend ✅ DONE

**Mục tiêu:** Server CRUD với filter theo môi trường, Hardware inventory  
**Thời gian:** Sprint 3 (1 tuần từ 2026-04-22)  
**Report:** [docs/reports/sprint-03.md](docs/reports/sprint-03.md) *(tạo sau khi hoàn thành)*

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S3-01 | `[BE]` GET /servers — list với filter (env, status, infra_type, site) + pagination | 3 | ✅ | 4.1 |
| S3-02 | `[BE]` GET /servers/:id — detail với hardware, network, deployments | 3 | ✅ | 4.1 |
| S3-03 | `[BE]` POST /servers — tạo server (ADMIN, OPERATOR) | 3 | ✅ | 4.1 |
| S3-04 | `[BE]` PATCH /servers/:id — cập nhật server | 2 | ✅ | 4.1 |
| S3-05 | `[BE]` DELETE /servers/:id — soft delete (set deleted_at) | 2 | ✅ | 4.1 |
| S3-06 | `[BE]` GET /servers/:id/change-history — lịch sử thay đổi server | 3 | ✅ | 4.1, 4.6 |
| S3-07 | `[BE]` GET /hardware — list hardware với filter (server_id, type) | 2 | ✅ | 4.2 |
| S3-08 | `[BE]` POST /hardware — tạo hardware component | 2 | ✅ | 4.2 |
| S3-09 | `[BE]` PATCH /hardware/:id — cập nhật component | 2 | ✅ | 4.2 |
| S3-10 | `[BE]` POST /hardware/:id/attach — gán vào server | 2 | ✅ | 4.2 |
| S3-11 | `[BE]` POST /hardware/:id/detach — gỡ khỏi server | 2 | ✅ | 4.2 |
| S3-12 | `[BE]` GET /hardware/:id/history — lịch sử gán/gỡ | 2 | ✅ | 4.2 |
| S3-13 | `[BE]` ChangeHistory service: auto-snapshot khi PATCH server/hardware | 3 | ✅ | 4.6 |
| S3-14 | `[BE]` Server module: RegisterModule decorator, ModuleGuard | 2 | ✅ | 4.0b |

**Sprint 3 Total: 33 points**

---

## Sprint 4 — Network & Server Frontend ✅ DONE

**Mục tiêu:** Network backend + toàn bộ UI cho Server/Hardware/Network  
**Thời gian:** Sprint 4 (2026-04-10)  
**Report:** [docs/reports/sprint-04.md](docs/reports/sprint-04.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S4-01 | `[BE]` GET /network-configs — list với filter (server_id, env, ip) | 3 | ✅ | 4.3 |
| S4-02 | `[BE]` POST /network-configs — tạo với IP conflict detection | 5 | ✅ | 4.3 |
| S4-03 | `[BE]` PATCH /network-configs/:id — cập nhật với conflict check | 3 | ✅ | 4.3 |
| S4-04 | `[BE]` DELETE /network-configs/:id — soft delete | 2 | ✅ | 4.3 |
| S4-05 | `[BE]` GET /network-configs/lookup-domain — domain → server → app | 3 | ✅ | 4.3 |
| S4-06 | `[FE]` Server list page: DataTable với env tabs (DEV/UAT/PROD), filter | 5 | ✅ | 4.1 |
| S4-07 | `[FE]` Server detail page: tabs (Info / Hardware / Network / Apps / History) | 8 | ✅ | 4.1 |
| S4-08 | `[FE]` Server create/edit form | 3 | ✅ | 4.1 |
| S4-09 | `[FE]` Hardware tab: CRUD inline, attach/detach modal | 5 | ✅ | 4.2 |
| S4-10 | `[FE]` Network tab: CRUD inline, IP conflict alert | 5 | ✅ | 4.3 |
| S4-11 | `[FE]` Change history timeline component (shared) | 3 | ✅ | 4.6 |
| S4-12 | `[FE]` "Changed badge" indicator component | 1 | ✅ | 4.1 |

**Sprint 4 Total: 46 points**

---

## Sprint 5 — Application & AppGroup Backend ✅ DONE

**Mục tiêu:** ApplicationGroup, Application, SystemSoftware, DeploymentDocType backend  
**Thời gian:** Sprint 5 (2026-04-10)  
**Report:** [docs/reports/sprint-05.md](docs/reports/sprint-05.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S5-01 | `[BE]` ApplicationGroup CRUD: GET, POST, PATCH, DELETE | 3 | ✅ | 4.4 |
| S5-02 | `[BE]` Application CRUD: GET, POST, PATCH, DELETE (soft) | 3 | ✅ | 4.4.2 |
| S5-03 | `[BE]` GET /applications/:id — với group, active deployments | 2 | ✅ | 4.4.2 |
| S5-04 | `[BE]` GET /applications/:id/where-running — server list theo env | 3 | ✅ | 4.4.2 |
| S5-05 | `[BE]` SystemSoftware CRUD | 3 | ✅ | 4.4.1 |
| S5-06 | `[BE]` DeploymentDocType CRUD (ADMIN only) | 3 | ✅ | 4.4.4 |
| S5-07 | `[BE]` GET /servers/:id/applications — apps đang chạy trên server | 2 | ✅ | 4.4.2 |
| S5-08 | `[BE]` Port CRUD: GET, POST, PATCH, DELETE | 3 | ✅ | 4.4.3 |
| S5-09 | `[BE]` Port conflict detection (same server + port + protocol) | 5 | ✅ | 4.4.3 |
| S5-10 | `[BE]` AppDeployment CRUD (no file upload yet) | 5 | ✅ | 4.4.2 |
| S5-11 | `[BE]` GET /deployments/:id — với deployment docs progress | 3 | ✅ | 4.4.2 |
| S5-12 | `[BE]` Auto-create DeploymentDoc records from active DocTypes | 3 | ✅ | 4.4.4 |
| S5-13 | `[BE]` ChangeHistory: auto-snapshot khi PATCH application/deployment | 2 | ✅ | 4.6 |

**Sprint 5 Total: 40 points**

---

## Sprint 6 — Deployment Docs & Application Frontend ✅ DONE

**Mục tiêu:** File upload cho DeploymentDoc, toàn bộ UI Application/Deployment  
**Thời gian:** Sprint 6 (2026-04-10)  
**Report:** [docs/reports/sprint-06.md](docs/reports/sprint-06.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S6-01 | `[BE]` File upload service (local disk, MIME validate, 20MB limit) | 5 | ✅ | 4.4.2 |
| S6-02 | `[BE]` POST /deployments/:id/docs/:docTypeId/preview — upload preview | 3 | ✅ | 4.4.2 |
| S6-03 | `[BE]` POST /deployments/:id/docs/:docTypeId/final — upload final (PDF only) | 3 | ✅ | 4.4.2 |
| S6-04 | `[BE]` PATCH /deployments/:id/docs/:docTypeId/waive — waive tài liệu | 2 | ✅ | 4.4.2 |
| S6-05 | `[BE]` GET /deployments/:id/docs/:docTypeId/file — serve file | 2 | ✅ | 4.4.2 |
| S6-06 | `[FE]` ApplicationGroup list + CRUD modal | 3 | ✅ | 4.4 |
| S6-07 | `[FE]` Application list: filter theo group, env, status | 5 | ✅ | 4.4.2 |
| S6-08 | `[FE]` Application detail: tabs (Info / Deployments / Ports / Connections) | 8 | ✅ | 4.4.2 |
| S6-09 | `[FE]` Deployment list: filter theo env, status, app | 5 | ✅ | 4.4.2 |
| S6-10 | `[FE]` Deployment detail: management info + doc progress tracker | 8 | ✅ | 4.4.2 |
| S6-11 | `[FE]` File upload component: preview/final upload, PDF viewer inline | 8 | ✅ | 4.4.2 |
| S6-12 | `[FE]` Port management tab trong Application detail | 3 | ✅ | 4.4.3 |
| S6-13 | `[FE]` SystemSoftware page + DeploymentDocType admin config | 3 | ✅ | 4.4.1, 4.4.4 |
| S6-14 | `[FE]` "Where is X running?" quick lookup | 3 | ✅ | 4.4.2 |

**Sprint 6 Total: 61 points**

---

## Sprint 7 — Connection & Audit Log ✅ DONE

**Mục tiêu:** AppConnection CRUD + Audit Log UI + Change History  
**Thời gian:** Sprint 7 (2026-04-10)  
**Report:** [docs/reports/sprint-07.md](docs/reports/sprint-07.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S7-01 | `[BE]` AppConnection CRUD: GET, POST, PATCH, DELETE | 5 | ✅ | 4.5 |
| S7-02 | `[BE]` GET /connections — filter theo env, source, target, protocol | 3 | ✅ | 4.5 |
| S7-03 | `[BE]` GET /applications/:id/dependencies — upstream + downstream | 3 | ✅ | 4.5 |
| S7-04 | `[BE]` Audit log: export CSV (stream large result) | 3 | ✅ | 4.6 |
| S7-05 | `[FE]` Audit Log page: DataTable với full filter (user, action, resource, time) | 5 | ✅ | 4.6 |
| S7-06 | `[FE]` Audit Log: detail modal (old/new value diff view) | 5 | ✅ | 4.6 |
| S7-07 | `[FE]` Audit Log: export CSV button | 2 | ✅ | 4.6 |
| S7-08 | `[FE]` Connection list page + CRUD | 5 | ✅ | 4.5 |
| S7-09 | `[FE]` Dependency view component (upstream/downstream tree) | 5 | ✅ | 4.5 |
| S7-10 | `[FE]` Change History timeline (shared component dùng cho Server/App/Network) | 5 | ✅ | 4.6 |
| S7-11 | `[INT]` E2E test: auth flow (login → setup wizard → seed demo) | 5 | ✅ | — |
| S7-12 | `[INT]` E2E test: CRUD server → hardware → network → app → deployment | 8 | ✅ | — |

**Sprint 7 Total: 54 points**

---

## Sprint 8 — Topology 2D (Phase 2 Start) ✅ DONE

**Mục tiêu:** Topology 2D visualization với React Flow  
**Thời gian:** Sprint 8 (2026-04-10 → 2026-04-16)  
**Hoàn thành:** Merged to main via MR !1  
**Report:** [docs/reports/sprint-08.md](docs/reports/sprint-08.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S8-01 | `[BE]` GraphQL schema setup (Apollo Server trong NestJS) | 5 | ✅ | 4.5 |
| S8-02 | `[BE]` GraphQL query: topology(environment) — servers + connections + deployments | 5 | ✅ | 4.5 |
| S8-03 | `[BE]` GraphQL query: appDependency(appId) | 3 | ✅ | 4.5 |
| S8-04 | `[BE]` TopologySnapshot: create, list, get payload | 5 | ✅ | 4.5.1 |
| S8-05 | `[FE]` Cài Apollo Client + GraphQL codegen | 3 | ✅ | — |
| S8-06 | `[FE]` Topology 2D page với React Flow | 8 | ✅ | 4.5 |
| S8-07 | `[FE]` Node types: server node, app node với status color | 5 | ✅ | 4.5 |
| S8-08 | `[FE]` Edge types: protocol label, status color | 3 | ✅ | 4.5 |
| S8-09 | `[FE]` Zoom/pan, mini-map, layout options (force/hierarchical/circular) | 5 | ✅ | 4.5 |
| S8-10 | `[FE]` Click node → side panel detail | 3 | ✅ | 4.5 |
| S8-11 | `[FE]` Filter panel: env, site, app, server | 3 | ✅ | 4.5 |
| S8-12 | `[FE]` Export PNG/SVG/JSON/Mermaid | 5 | ✅ | 4.5 |
| S8-13 | `[FE]` Snapshot browser: timeline + compare 2 snapshots | 8 | ✅ | 4.5.1 |

**Sprint 8 Total: 61 points**

---

## Sprint 9 — System Management & CSV Import ✅ DONE

**Mục tiêu:** Hệ thống (InfraSystem) nhóm servers theo nghiệp vụ, phân quyền người dùng, import CSV  
**Thời gian:** Sprint 9 (1 tuần từ 2026-04-17)  
**Tiền điều kiện:** Sprint 8 hoàn thành  
**Report:** [docs/reports/sprint-09.md](docs/reports/sprint-09.md) *(tạo sau khi hoàn thành)*  
**Bug report:** [docs/reports/bug-report-sprint9-qa.md](docs/reports/bug-report-sprint9-qa.md)

### QA Bug Fixes (từ Sprint 8 merge)

| # | Task | Points | Status | Ref |
|---|---|---|---|---|
| S9-QA1 | `[FE]` Fix `is_required` → `required` field mismatch (DeploymentDocType create/display) | 1 | ✅ | BUG-001 |
| S9-QA2 | `[FE]` Fix pageSize không cập nhật query: AuditLogPage | 1 | ✅ | BUG-002 |
| S9-QA3 | `[FE]` Fix pageSize không cập nhật query: UsersPage + UserGroupsPage | 1 | ✅ | BUG-003 |

### Backend Tasks

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S9-01 | `[BE]` Prisma: add InfraSystem, InfraSystemServer, InfraSystemAccess + url field to Port | 3 | ✅ | 4.0b |
| S9-02 | `[BE]` Migration: add_infra_system_tables | 1 | ✅ | — |
| S9-03 | `[BE]` InfraSystem CRUD: GET, POST, PATCH, DELETE (ADMIN/OPERATOR with access check) | 5 | ✅ | 4.0b |
| S9-04 | `[BE]` Access management: GET /infra-systems/:id/access, POST grant, DELETE revoke | 3 | ✅ | 4.0b |
| S9-05 | `[BE]` CSV import endpoint + parser: System, AppName, IP, Port, Url, Info columns | 8 | ✅ | 4.0b |
| S9-06 | `[BE]` CSV import creates/finds: InfraSystem, Server, Application, AppDeployment, Port | 5 | ✅ | 4.0b |
| S9-07 | `[BE]` Access control filter in findAll: ADMIN sees all, OPERATOR/VIEWER by access | 3 | ✅ | 4.0b |
| S9-08 | `[BE]` Seed: register INFRA_SYSTEM module in module_configs | 1 | ✅ | 4.0b |

### Frontend Tasks

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S9-09 | `[FE]` System list page: DataTable, filter, create/edit modal | 5 | ✅ | 4.0b |
| S9-10 | `[FE]` InfraSystemForm modal: create/edit with validation | 3 | ✅ | 4.0b |
| S9-11 | `[FE]` AccessManagementModal: list grants, add user/group, revoke | 5 | ✅ | 4.0b |
| S9-12 | `[FE]` CsvImportModal: upload → preview (20 rows) → confirm → summary | 5 | ✅ | 4.0b |
| S9-13 | `[FE]` useInfraSystems hook: all TanStack Query operations | 3 | ✅ | — |
| S9-14 | `[FE]` Routes: add /infra-systems, /infra-systems/:id + sidebar menu | 2 | ✅ | 4.0b |

### Definition of Done Sprint 9
- [x] All endpoints documented in Swagger
- [x] CSV import tested with sample data
- [x] Access control verified: VIEWER only sees granted systems
- [x] Unit tests for service layer

**Sprint 9 Total: 52 points**

---

## Sprint 10 — Topology 3D & Realtime ✅ DONE

**Mục tiêu:** 3D visualization + GraphQL subscriptions realtime  
**Thời gian:** Sprint 10 (2026-04-21)  
**Tiền điều kiện:** Sprint 9 hoàn thành  
**Report:** [docs/reports/sprint-10.md](docs/reports/sprint-10.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S10-01 | `[BE]` GraphQL subscriptions: connectionStatusChanged, serverStatusChanged, topologyChanged | 8 | ✅ | 4.5 |
| S10-02 | `[BE]` WebSocket gateway setup (graphql-ws protocol) | 5 | ✅ | 4.5 |
| S10-03 | `[BE]` Manual status update endpoint: PATCH /servers/:id/status | 2 | ✅ | 4.5 |
| S10-04 | `[FE]` GraphQL subscriptions client (Apollo) + realtime edge/node updates | 5 | ✅ | 4.5 |
| S10-05 | `[FE]` Topology 3D với React Three Fiber | 13 | ✅ | 4.5 |
| S10-06 | `[FE]` 3D: node groups theo layer (Physical → Server → App) | 5 | ✅ | 4.5 |
| S10-07 | `[FE]` 3D: explode view theo env/site (DC/DR) | 5 | ✅ | 4.5 |
| S10-08 | `[FE]` 3D: hover highlight connections, orbit controls | 3 | ✅ | 4.5 |
| S10-09 | `[FE]` 2D/3D mode switcher | 2 | ✅ | 4.5 |
| S10-10 | `[FE]` Realtime status badge + fallback polling | 3 | ✅ | 4.5 |

**Sprint 10 Total: 51 points**

---

## Sprint 11 — ChangeSet Draft & Preview ✅ DONE

**Mục tiêu:** ChangeSet workflow — draft, preview, apply  
**Thời gian:** Sprint 11 (2026-04-21)  
**Tiền điều kiện:** Sprint 10 hoàn thành; module `CHANGESET` ENABLED  
**Report:** [docs/reports/sprint-11.md](docs/reports/sprint-11.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S11-01 | `[BE]` ChangeSet CRUD: create, list, get, discard | 5 | ✅ | 4.5.2 |
| S11-02 | `[BE]` ChangeItem: add/remove item trong draft | 3 | ✅ | 4.5.2 |
| S11-03 | `[BE]` Preview engine: compute topology với ChangeItems overlaid | 8 | ✅ | 4.5.2 |
| S11-04 | `[BE]` Preview validation: port conflict, IP conflict, circular deps | 5 | ✅ | 4.5.2 |
| S11-05 | `[BE]` Apply ChangeSet: transaction apply + auto-snapshot | 8 | ✅ | 4.5.2 |
| S11-06 | `[FE]` ChangeSet list page (filter status, env, creator) | 3 | ✅ | 4.5.2 |
| S11-07 | `[FE]` ChangeSet detail: ChangeItem list với old/new values | 5 | ✅ | 4.5.2 |
| S11-08 | `[FE]` Preview mode: render topology diff trên graph (green/red/yellow) | 8 | ✅ | 4.5.2 |
| S11-09 | `[FE]` Preview: warning panel (conflicts detected) | 3 | ✅ | 4.5.2 |
| S11-10 | `[FE]` Apply confirm dialog + discard confirm | 2 | ✅ | 4.5.2 |
| S11-11 | `[FE]` Draft mode: intercept edit actions → add to ChangeSet | 8 | ✅ | 4.5.2 |

**Sprint 11 Total: 58 points**

---

## Sprint 12 — Polish, Performance & SSO ✅ DONE

**Mục tiêu:** Microsoft 365 SSO, UI polish, performance, CSV import  
**Thời gian:** Sprint 12 (2026-04-21)  
**Report:** [docs/reports/sprint-12.md](docs/reports/sprint-12.md)

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S12-01 | `[BE]` Microsoft 365 SSO (Passport OIDC + Azure AD) | 8 | ✅ | 4.0.1 |
| S12-02 | `[BE]` Account linking: merge SSO user với existing local account | 5 | ✅ | 4.0.1 |
| S12-03 | `[BE]` Import CSV/Excel: server, application, deployment bulk import | 8 | ✅ | 4.0b |
| S12-04 | `[BE]` Alert & Notification: OS end-of-support alert, port conflict alert | 5 | ✅ | 4.0b |
| S12-05 | `[FE]` SSO login button + callback page | 3 | ✅ | 4.0.1 |
| S12-06 | `[FE]` Dashboard: OS end-of-support warnings, recent changes summary | 5 | ✅ | 6 |
| S12-07 | `[FE]` Global search (server/app/network by name/IP/domain) | 5 | ✅ | 6 |
| S12-08 | `[FE]` Dark mode toggle | 2 | ✅ | 6 |
| S12-09 | `[FE]` CSV import UI (upload → preview → confirm) | 5 | ✅ | 4.0b |
| S12-10 | `[INT]` Performance testing: API < 500ms, topology < 2s | 3 | ✅ | 5 |
| S12-11 | `[INT]` Full E2E Playwright suite: auth, admin, server, app, topology | 8 | ✅ | — |

**Sprint 12 Total: 57 points**

---

## Sprint 13 — Interactive Topology 2D & Networks Layout ✅ DONE

**Mục tiêu:** Nâng cấp Topology 2D với bố cục kiểu mạng lưới (Networks Layout) và cho phép tương tác trực tiếp tạo/xoá kết nối. Tự động chọn port nếu app đích chỉ có 1 port, hoặc hỏi người dùng qua popup.
**Thời gian:** 2026-04-21 → 2026-04-23
**Branch:** `feat/sprint-13-network-topology`
**Report:** [docs/reports/sprint-13.md](docs/reports/sprint-13.md) *(tạo sau khi hoàn thành)*

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S13-01 | `[BE]` Thêm `target_port_id` vào `AppConnection` Prisma schema, tạo migration | 3 | ✅ | 4.5 |
| S13-02 | `[BE]` Cập nhật DTO `CreateConnectionDto`, `UpdateConnectionDto` & `ConnectionService` | 3 | ✅ | 4.5 |
| S13-03 | `[BE]` GraphQL: Bổ sung entity `targetPort` vào `TopologyConnection` | 2 | ✅ | 4.5 |
| S13-04 | `[FE]` Thêm `CreateConnectionModal` để xử lý form tạo Edge. Logic: Tự động kết nối nếu 1 port | 5 | ✅ | 4.5 |
| S13-05 | `[FE]` Xử lý `onConnect` event và `onEdgeClick` (xoá kết nối) trong `ReactFlow` + Draft Interceptor | 5 | ✅ | 4.5 |
| S13-06 | `[FE]` Cấu hình Layout "Networks" (Server Box cho AppNodes) | 5 | ✅ | 4.5 |

| S13-07 | `[FE]` Auto Arrange → fitView: dùng `requestAnimationFrame` x2, xoá userPositions để đảm bảo toàn bộ node nằm gọn trong viewport | 1 | ✅ | 4.5.4 |
| S13-08 | `[FE]` Draggable edge labels: kéo nhãn protocol để tránh chồng lấp, lưu offset trong edge data | 3 | ✅ | 4.5.4 |
| S13-09 | `[FE]` Drag/drop node position preservation: giữ vị trí node đã kéo sau khi dữ liệu refetch | 2 | ✅ | 4.5.4 |
| S13-10 | `[FE]` Fullscreen button: nút toàn màn hình cho canvas 2D, dùng Fullscreen API, icon đổi trạng thái | 1 | ✅ | 4.5.4 |

**Sprint 13 Total: 30 points**

---

## Sprint 14 — UX Polish & Floating Filters ✅ DONE

**Mục tiêu:** Cải thiện trải nghiệm người dùng trên trang Topology, đảm bảo bộ lọc luôn hiển thị ở top của view kể cả khi ở chế độ toàn màn hình. Đồng bộ bộ lọc trên tất cả các engine 2D và 3D.
**Thời gian:** 2026-04-23 → 2026-04-30
**Branch:** `feat/topology-floating-filters`

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S14-01 | `[FE]` Refactor `TopologyFilterPanel` sang giao diện thanh ngang (Horizontal Bar) | 3 | ✅ | 4.5 |
| S14-02 | `[FE]` Di chuyển `TopologyFilterPanel` ra ngoài engine-specific blocks trong `index.tsx` | 2 | ✅ | 4.5 |
| S14-03 | `[FE]` Set `vis-network` làm engine mặc định và tối ưu z-index bộ lọc | 1 | ✅ | 4.5 |
| S14-04 | `[FE]` Cải thiện phân biệt thị giác giữa Server và App nodes (màu sắc, hình dạng) | 3 | ✅ | 4.5 |
| S14-05 | `[FE]` Tối ưu logic Auto Arrange (React Flow/Cytoscape) cho các node không có kết nối | 3 | ✅ | 4.5 |

---

## Sprint 15 — Server Import & Data Enrichment 🔄 IN PROGRESS

**Mục tiêu:** Cải thiện logic import Server từ CSV (OS, Hardware specs) và đơn giản hóa quy trình import bằng cách tập trung vào Server.

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S15-01 | `[BE]` Thêm trường `os` vào model `Server` và tạo migration | 2 | ✅ | 4.1 |
| S15-02 | `[BE]` Cập nhật DTOs & ServerService hỗ trợ trường `os` | 2 | ✅ | 4.1 |
| S15-03 | `[BE]` Cập nhật ImportService: map OS và chuẩn hóa Hardware specs | 3 | ✅ | 4.1 |
| S15-04 | `[FE]` Sidebar: Rename "Upload" → "Upload Server" | 1 | ✅ | 6.0 |
| S15-05 | `[FE]` Refactor `InfraUploadPage`: Chỉ giữ lại chức năng Upload Server | 3 | ✅ | 4.1 |
| S15-06 | `[FE]` UI: Hiển thị OS và Hardware specs chi tiết (Cores, GB) | 3 | ✅ | 4.1 |
| S15-07 | `[FE]` ServerForm: Thêm trường nhập liệu Hệ điều hành | 2 | ✅ | 4.1 |

#### Sprint 15 Extension — OS Lifecycle Tracking

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S15-08 | `[BE]` Schema — ServerOsInstall + migrate server.os | 3 | ⬜ | 4.8.2 |
| S15-09 | `[BE]` Application — thêm sw_type enum + OS catalog API | 2 | ⬜ | 4.8.2 |
| S15-10 | `[BE]` ServerOsInstall — CRUD API | 4 | ⬜ | 4.8.2 |
| S15-11 | `[BE]` ImportService — xử lý OS qua catalog | 3 | ⬜ | 4.8.2 |
| S15-12 | `[BE]` Server query — include OS display | 1 | ⬜ | 4.8.2 |
| S15-13 | `[FE]` Import wizard — bước OS Resolution | 5 | ⬜ | 4.8.2 |
| S15-14 | `[FE]` Server Detail — OS History tab/section | 4 | ⬜ | 4.8.2 |
| S15-15 | `[FE]` Cập nhật ServerForm & ServerList | 2 | ⬜ | 4.8.2 |

## Sprint 16 — App Group Restructure & Catalog Unification 🔄 IN PROGRESS

**Mục tiêu:** Tái cấu trúc nhóm ứng dụng (Business vs Infra), hợp nhất Catalog phần mềm hệ thống.

| # | Task | Points | Status | SRS Ref |
|---|---|---|---|---|
| S16-01 | `[BE]` Schema: Thêm GroupType enum & field vào ApplicationGroup | 2 | ✅ | 4.8.3 |
| S16-02 | `[BE]` Schema: Thêm eol_date, vendor vào Application model | 1 | ✅ | 4.8.3 |
| S16-03 | `[BE]` Data Migration: SystemSoftware -> Application Catalog | 3 | ✅ | 4.8.3 |
| S16-04 | `[BE]` AppGroup DTO & Service: Phân loại theo GroupType | 2 | ✅ | 4.8.3 |
| S16-05 | `[BE]` Application DTO & Service: Validation type & group | 3 | ✅ | 4.8.3 |
| S16-06 | `[BE]` SystemSoftware endpoint: Delegate sang ApplicationService | 2 | ✅ | 4.8.3 |
| S16-07 | `[FE]` Types & Hooks: Cập nhật cho GroupType và App Metadata | 1 | ✅ | 4.8.3 |
| S16-08 | `[FE]` AppGroup UI: Badge phân loại & Filter theo GroupType | 2 | ✅ | 4.8.3 |
| S16-09 | `[FE]` Application Form: Dropdown lọc nhóm theo context + SYSTEM fields | 3 | ✅ | 4.8.3 |
| S16-10 | `[FE]` Application Page: Tách tab Nghiệp vụ / Hạ tầng / Nhóm | 3 | ✅ | 4.8.3 |
| S16-11 | `[FE]` SystemSoftware Page: Redirect sang /applications?tab=infra | 1 | ✅ | 4.8.3 |
| S16-12 | `[BE]` Sidebar: Link Phần mềm hạ tầng | 1 | ✅ | 4.8.3 |
| S16-13 | `[BE]` Import: Auto-create group với đúng GroupType | 1 | ✅ | 4.8.3 |

---

## Sprint 20 — UI/UX Polish: Import Consistency, Bulk Actions & Form Modernization ✅ DONE

**Mục tiêu:** Đồng nhất trải nghiệm import server với app-import (Dragger + Steps), bổ sung hướng dẫn còn thiếu, thêm bulk-delete cho nhóm ứng dụng, form nhập phần cứng dùng key-value UI, cải thiện layout form.
**Thời gian:** 2026-04-30
**Branch:** `feat/sprint-20-ux-polish`
**Plan:** [docs/plans/sprint-20-ux-polish.md](docs/plans/sprint-20-ux-polish.md)

| # | Task | Points | Status | SRS Ref |
|---|------|--------|--------|---------|
| S20-01 | `[FE]` Refactor `infra-upload/index.tsx`: Dragger + Steps 4-bước wizard (đồng nhất app-import) | 3 | ✅ | 4.2.4 |
| S20-02 | `[FE/DOCS]` GuidePage: thêm menu "Import CSV"; cập nhật `import.md`, `guide_infra.md` | 2 | ✅ | — |
| S20-03 | `[FE]` AppGroupList: thêm rowSelection + bulk delete (như infra-system) | 2 | ✅ | 4.6.1 |
| S20-04 | `[FE]` HardwareTab: thay JSON textarea `specs` bằng Form.List key-value editor | 3 | ✅ | 4.1.3 |
| S20-05 | `[FE]` ServerForm, ApplicationForm, AppGroupModal: Row/Col 2-column layout | 3 | ✅ | — |

**Sprint 20 Total: 13 points**

---

## Sprint 21 — Topology Smart Auto-Layout & Collision Avoidance 🔄 IN PROGRESS

**Mục tiêu:** Nâng cấp layout Topology 2D: thêm thuật toán ELK, direction toggle TB/LR, cải thiện collision avoidance khi drag.
**Thời gian:** 2026-04-30
**Branch:** `feat/sprint-21-topology-smart-layout`
**Plan:** [docs/plans/sprint-21-topology-smart-layout.md](docs/plans/sprint-21-topology-smart-layout.md)

| # | Task | Points | Status | SRS Ref |
|---|------|--------|--------|---------|
| S21-01 | `[FE]` FilterState: thêm `layoutDirection` + cập nhật computeLayout + FilterPanel direction UI | 2 | ✅ | 4.5.7 |
| S21-02 | `[FE]` Install elkjs + implement `applyElkLayout` async + thêm Algorithm selector trong FilterPanel | 5 | ✅ | 4.5.7 |
| S21-03 | `[FE]` Cải thiện collision avoidance trong handleNodeDragStop: 8-direction push | 2 | ✅ | 4.5.7 |

**Sprint 21 Total: 9 points**

---

## Sprint 19 — Topology Orthogonal Edges & UX Polish ✅ DONE

**Mục tiêu:** Bổ sung chế độ kết nối thẳng góc (orthogonal edges) cho Topology 2D, cải thiện khả năng đọc hiểu sơ đồ khi có nhiều kết nối chồng lấp.
**Thời gian:** 2026-04-29
**Branch:** `feat/sprint-19-topology-orthogonal-edges`
**Plan:** [docs/plans/sprint-19-topology-orthogonal-edges.md](docs/plans/sprint-19-topology-orthogonal-edges.md)

| # | Task | Points | Status | SRS Ref |
|---|------|--------|--------|---------|
| S19-01 | `[FE]` Thêm `edgeStyle` vào `FilterState` + Select "Edges" trong `TopologyFilterPanel` | 1 | ✅ | 4.5.5 |
| S19-02 | `[FE]` Import `getSmoothStepPath`, cập nhật `ProtocolEdge` dual-mode + parallel spread | 2 | ✅ | 4.5.5 |
| S19-03 | `[FE]` Mở rộng FilterState + 3 multi-select visibility filter trong `TopologyFilterPanel` | 2 | ✅ | 4.5.6 |
| S19-04 | `[FE]` Compute options + mở rộng `filteredData` useMemo áp dụng visibility filters | 1 | ✅ | 4.5.6 |

**Sprint 19 Total: 6 points**

---

## Sprint 18 — Multi-Port per Deployment & Connection Import ✅ DONE

**Mục tiêu:** (1) 1 deployment có thể khai báo nhiều cặp port-protocol. (2) Import kết nối app-to-app từ CSV. (3) Tối ưu hóa UI import — gộp 3 trang thành 1 trang tabbed.
**Thời gian:** 2026-04-25
**Branch:** `feat/sprint-18-multi-port-connection-import`
**Plan:** [docs/plans/sprint-18-multi-port-connection-import.md](docs/plans/sprint-18-multi-port-connection-import.md)

| # | Task | Points | Status | SRS Ref |
|---|------|--------|--------|---------|
| S18-01 | `[BE]` Thêm `parsePortsString()`, cập nhật `DEPLOYMENT_COLUMNS` và `validateRows` cho multi-port | 2 | ✅ | 4.8.4 |
| S18-02 | `[BE]` Refactor `importDeployment()` — tạo nhiều Port record per deployment, backward compat | 2 | ✅ | 4.8.4 |
| S18-03 | `[BE]` Thêm `CONNECTION_COLUMNS`, `importConnection()` — upsert AppConnection | 3 | ✅ | 4.8.5 |
| S18-04 | `[BE]` Cập nhật `ImportPreviewDto` + controller — nhận `type=connection` | 1 | ✅ | 4.8.5 |
| S18-05 | `[FE]` Cập nhật `deployment-upload/index.tsx` — thay port/protocol/service_name bằng `ports` | 1 | ✅ | 4.8.4 |
| S18-06 | `[FE]` Tạo `pages/connection-upload/index.tsx` — 4-step wizard | 3 | ✅ | 4.8.5 |
| S18-07 | `[FE]` Thêm route `/connection-upload` + Sidebar menu | 1 | ✅ | 4.8.5 |
| S18-08 | `[DATA]` Cập nhật `deployments.csv` sang format `ports` multi-port | 1 | ✅ | — |
| S18-09 | `[DATA]` Tạo `connections.csv` demo — ~30 kết nối PROD/UAT/DEV | 2 | ✅ | — |
| S18-10 | `[FE]` Refactor `app-upload`, `deployment-upload`, `connection-upload` — extract Content components | 2 | ✅ | — |
| S18-11 | `[FE]` Tạo `/app-import/index.tsx` — unified tabbed import page cho 3 loại (app/deployment/connection) | 3 | ✅ | — |
| S18-12 | `[FE]` Fix topology layout — di chuyển Segmented controls từ title → extra prop | 1 | ✅ | — |

**Sprint 18 Total: 22 points** ✅ DONE

---

## Sprint 17 — Deployment Upload UI ✅ DONE

**Mục tiêu:** Bổ sung trang UI import deployment từ CSV, hoàn chỉnh bộ 3 upload flow (Server → Application → Deployment). Fix upsert duplicate trong importDeployment.  
**Thời gian:** 2026-04-25  
**Branch:** `feat/sprint-17-deployment-upload`  
**Plan:** [docs/plans/sprint-17-deployment-upload.md](docs/plans/sprint-17-deployment-upload.md)

| # | Task | Points | Status | SRS Ref |
|---|------|--------|--------|---------|
| S17-01 | `[BE]` Thêm `DEPLOYMENT_HEADER_ALIASES` vào validateRows | 1 | ✅ | 4.7.4 |
| S17-02 | `[BE]` Refactor `importDeployment`: upsert theo (app+server+env) | 1 | ✅ | 4.7.4 |
| S17-03 | `[FE]` Tạo `pages/deployment-upload/index.tsx` | 3 | ✅ | 4.7.4 |
| S17-04 | `[FE]` Thêm route `/deployment-upload` vào `App.tsx` | 1 | ✅ | 4.7.4 |
| S17-05 | `[FE]` Thêm menu item "Upload Deployment" vào Sidebar | 1 | ✅ | 4.7.4 |
| S17-06 | `[BE]` Import port/protocol/service_name — tạo Port record trong transaction | 2 | ✅ | 4.4.3 |
| S17-07 | `[BE]` Port conflict detection trong importDeployment (rollback nếu conflict) | 2 | ✅ | 4.4.3 |
| S17-08 | `[FE]` Column mapper: thêm port/protocol/service_name target fields | 1 | ✅ | 4.4.3 |
| S17-09 | Demo: cập nhật `deployments.csv` với port/protocol/service_name (verified no conflict) | 1 | ✅ | — |

**Sprint 17 Total: 13 points**

---

## Backlog — Chưa lên sprint

| # | Task | Points | Notes |
|---|---|---|---|
| BL-01 | `[BE]` SSH sync / auto-discovery agent | 13 | Phase 3 — EXTENDED |
| BL-02 | `[BE]` Prometheus Alertmanager webhook | 8 | EXTENDED |
| BL-03 | `[FE]` Mobile-responsive layout | 8 | Not required for v1 |
| BL-04 | `[BE]` Scheduled topology snapshots (cron) | 3 | EXTENDED |
| BL-05 | `[BE]` Audit log retention policy + auto-purge | 3 | Phase 3 |
| BL-06 | `[BE]` PlantUML/Mermaid export endpoint | 3 | EXTENDED |
| BL-07 | `[FE]` VR topology view | 13 | Future |
| BL-08 | CI/CD GitHub Actions (lint + test + build + deploy) | 5 | DevOps |
| BL-09 | Production Docker Compose (nginx, SSL, env separation) | 5 | DevOps |

---

## Tổng kết roadmap

| Phase | Sprints | Mục tiêu | Điểm |
|---|---|---|---|
| **Phase 1** | S1–S7 | Core modules: Auth, User, Server, Hardware, Network, App, Deployment, Connection, Audit | ~308 |
| **Phase 2** | S8–S11 | Extended: Topology 2D/3D, System Management, Realtime, Snapshot, ChangeSet | ~222 |
| **Phase 3** | S12 | Polish: SSO, CSV Import, Alerts, Performance | 57 |
| **Phase 4** | S13–S14 | Phase 4: Interactive Topology & UX Polish | 39 |

**Tổng ước tính:** ~610 story points / 13 sprints (~47 SP/sprint)

---

## Cách sử dụng file này

1. **Bắt đầu sprint mới**: copy template từ [docs/reports/sprint-template.md](docs/reports/sprint-template.md), đổi status tasks từ `⬜` → `🔄` → `✅`
2. **Kết thúc sprint**: viết sprint report, cập nhật trạng thái tasks trong file này
3. **Handoff giữa sessions**: đọc `deployment-status.json` để biết runtime state, đọc file này để biết tiến độ feature
4. **Ưu tiên thực hiện**: theo thứ tự sprint — không nhảy sprint sau khi sprint trước chưa xong (trừ khi có dependency rõ ràng)
ó dependency rõ ràng)
