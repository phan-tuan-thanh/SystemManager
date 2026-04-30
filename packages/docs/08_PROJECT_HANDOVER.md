# Project Handover — Bàn giao Dự án

**Ngày bàn giao:** 2026-04-30  
**Sprint cuối hoàn thành:** Sprint 19  
**Branch chính:** `main`

---

## 1. Tổng quan Tiến độ

| Phase | Sprints | Mục tiêu | Trạng thái |
|-------|---------|---------|-----------|
| Phase 1 | S1–S7 | Core CRUD: Auth, User, Server, Hardware, Network, App, Deployment, Connection, Audit | ✅ Hoàn thành |
| Phase 2 | S8–S11 | Topology 2D/3D, ChangeSet, Snapshots, Realtime | ✅ Hoàn thành |
| Phase 3 | S12 | SSO Microsoft 365, CSV Import, Performance | ✅ Hoàn thành |
| Phase 4 | S13–S19 | Interactive Topology, Multi-port, Import UI, Node filter, Orthogonal edges | ✅ Hoàn thành |

**Tổng tiến độ: ~44% roadmap** (100% core backend, ~80% frontend features)

---

## 2. Lịch sử Sprint

### Sprint 0 — Bootstrap ✅ (2026-04-07)
- NestJS monorepo scaffold, Prisma schema 20+ models
- Docker Compose, JWT auth, AuditLog interceptor
- React + Vite setup, Setup Wizard, Auth flow

### Sprint 1–2 — User & UserGroup ✅ (2026-04-08–09)
- CRUD Users + Roles, UserGroup, Role inheritance
- Admin UI: Users page, UserGroups page, Module toggle

### Sprint 3–4 — Server, Hardware, Network ✅ (2026-04-10)
- Server CRUD với đầy đủ hardware + network components
- IP conflict detection, ChangeHistory timeline component
- Server detail 5 tabs

### Sprint 5–6 — Application & Deployment Docs ✅ (2026-04-10)
- AppGroup, Application CRUD, Port management
- DeploymentDoc workflow (Preview → Final → Waived)
- File upload service

### Sprint 7 — Connections & Audit Log ✅ (2026-04-10)
- AppConnection CRUD
- Audit Log DataTable với export CSV, diff modal

### Sprint 8 — Topology 2D ✅ (2026-04-16)
- GraphQL API (`topology`, `appDependency`)
- React Flow 2D canvas: Server nodes + App nodes + Protocol edges
- Export JSON/Mermaid

### Sprint 9 — System Management & CSV Import ✅ (2026-04-17)
- InfraSystem management + access control
- CSV Import với papaparse preview, column mapper
- Bug fixes: DocType fields, query pageSize

### Sprint 10–11 — Topology 3D & ChangeSet ✅ (2026-04-21)
- GraphQL Subscriptions: realtime status updates
- React Three Fiber 3D topology
- ChangeSet full workflow: Draft → Preview (Virtual Engine) → Apply

### Sprint 12 — SSO & Polish ✅ (2026-04-21)
- SSO Microsoft 365 (Azure AD OAuth)
- Bulk import Excel/CSV
- Dark mode, OS EOL warnings, performance <500ms

### Sprint 13–14 — Interactive Topology ✅ (2026-04-23)
- `target_port_id` trên AppConnection
- Drag-and-drop tạo kết nối trực tiếp
- Floating filter bar (horizontal, fullscreen-compatible)
- Nút fullscreen, kéo nhãn connection

### Sprint 15 — Server Import & OS Lifecycle ✅ (2026-04-24)
- Server import CSV chi tiết (OS, CPU, RAM, Storage)
- OS Lifecycle Tracking: `ServerOsInstall` bảng lịch sử
- Interactive OS mapping từ CSV
- Tab "Vòng đời OS" trong Server detail

### Sprint 16 — App Group Restructure ✅ (2026-04-24)
- `GroupType` enum (BUSINESS / INFRASTRUCTURE)
- Hợp nhất SystemSoftware → Application catalog
- `eol_date`, `vendor` trên Application
- Application page 3 tabs: Nghiệp vụ / Hạ tầng / Nhóm

### Sprint 17 — Deployment Upload ✅ (2026-04-25)
- Trang `/deployment-upload` 4-step wizard
- Header aliases cho CSV normalization
- Upsert deployment theo `(app, server, env)`

### Sprint 18 — Multi-Port & Import Consolidation ✅ (2026-04-25)
- Multi-port deployment (cột `ports` format: `8080-HTTP:name 9092-GRPC:name`)
- Trang `/connection-upload` 4-step wizard
- Hợp nhất 3 trang import → `/app-import` với tabs
- Sidebar: 3 menu items → 1 "Import CSV"

### Sprint 19 — Topology Enhancements ✅ (2026-04-29)
- Orthogonal edges: toggle `bezier` / `step` (smooth-step)
- `ProtocolEdge` dual-mode với parallel edge offset
- Node visibility filter popup modal (search, select-all, count badge)
- Server options hiển thị IP address
- `filteredData` pipeline 3 tầng + connection orphan cleanup
- Mermaid diagram engine mới
- Toolbar refactor + node focus highlight

---

## 3. Trạng thái Hiện tại Của Hệ thống

### Backend Modules ✅ Đã implement đầy đủ

| Module | Endpoints | Ghi chú |
|--------|-----------|---------|
| auth | login, refresh, logout, SSO | JWT + MS365 |
| user | CRUD, roles, reset password | ADMIN only create |
| user-group | CRUD, members | Role inheritance |
| server | CRUD, import CSV | IP conflict detection |
| hardware | CRUD per server | JSON specs |
| network | CRUD, conflict check | Per interface |
| app-group | CRUD | group_type filter |
| application | CRUD, import | BUSINESS + SYSTEM unified |
| deployment | CRUD, import multi-port | Upsert by (app,server,env) |
| port | CRUD, conflict check | Per deployment |
| connection | CRUD, import | target_port_id |
| topology | GraphQL query + subscription | Real-time |
| changeset | DRAFT→PREVIEW→APPLY | Virtual engine |
| snapshot | Create/list/restore | Auto after apply |
| audit | List, export CSV | Auto-logged |
| change-history | Timeline per resource | Snapshot JSON |
| infra-system | CRUD, access control | Groups servers |
| import | Preview endpoint | CSV parsing |
| system | Status, init, seed | First-run |
| module-config | Toggle on/off | 10+ modules |
| system-config | Logging config | Runtime |

### Frontend Pages ✅ Đã implement

| Route | Trang | Ghi chú |
|-------|-------|---------|
| `/dashboard` | Tổng quan | Metrics, quick links |
| `/servers` | Danh sách Server | Filter, pagination |
| `/servers/:id` | Chi tiết Server | 5 tabs + OS lifecycle |
| `/applications` | Ứng dụng | 3 tabs: Business/Infra/Groups |
| `/deployments` | Deployments | Filter, multi-port |
| `/connections` | Connections | App-to-app |
| `/topology` | Topology 2D/3D | ReactFlow/vis/Mermaid/3D |
| `/changesets` | ChangeSet | DRAFT→APPLY workflow |
| `/app-import` | Import CSV | 3 tabs, 4-step wizard |
| `/audit` | Audit Log | Export CSV |
| `/admin/users` | Quản lý Users | ADMIN only |
| `/admin/user-groups` | Nhóm người dùng | — |
| `/admin/modules` | Module config | Bật/tắt modules |
| `/setup` | Setup Wizard | First run only |

---

## 4. Known Issues & Limitations

| # | Vấn đề | Nghiêm trọng | Ghi chú |
|---|--------|-------------|---------|
| KI-01 | OS Lifecycle chưa có UI cập nhật từ trang Server Detail | Medium | Backend đã có, FE chưa implement update form |
| KI-02 | ChangeSet Preview chưa detect conflict port khi thêm deployment mới | Medium | Logic check trong ChangeSet service cần bổ sung |
| KI-03 | Topology 3D chưa có filter bar (chỉ hiển thị raw data) | Low | React Three Fiber view không có interactive filters |
| KI-04 | Mermaid engine không hỗ trợ click/drag nodes | Low | Đây là giới hạn của Mermaid (static diagram) |
| KI-05 | Không có notification realtime khi server status thay đổi (Subscription chưa kết nối FE) | Low | GraphQL subscription đã có BE, FE chưa wire |
| KI-06 | SSO MS365 chưa có màn hình error handling khi OAuth fail | Low | Backend trả 401, FE chưa có trang lỗi rõ ràng |
| KI-07 | File upload DeploymentDoc lưu local disk (không phải S3) | Low | OK cho dev/staging, cần S3 cho production |

---

## 5. Backlog — Tính năng Chưa Làm

| # | Tính năng | Points | Ưu tiên | Ghi chú |
|---|-----------|--------|---------|---------|
| BL-01 | CI/CD GitHub Actions (lint + test + build + deploy) | 5 | 🔴 High | Cần trước khi go-live |
| BL-02 | Production Docker Compose (Nginx + SSL + env separation) | 5 | 🔴 High | Cần trước khi go-live |
| BL-03 | Dashboard metrics thật (thay thế mock data) | 5 | 🟡 Medium | Cần query aggregate từ DB |
| BL-04 | OS Lifecycle — UI cập nhật từ Server Detail | 3 | 🟡 Medium | KI-01 |
| BL-05 | Scheduled topology snapshots (cron job) | 3 | 🟡 Medium | Auto-backup topology |
| BL-06 | GraphQL Subscription wire vào FE (realtime status) | 3 | 🟡 Medium | BE đã có, cần FE setup |
| BL-07 | Audit log retention policy + auto-purge | 3 | 🟡 Medium | Tránh DB phình to |
| BL-08 | SSH sync / auto-discovery agent | 13 | 🟢 Low | Phase 5 |
| BL-09 | Prometheus/Alertmanager webhook | 8 | 🟢 Low | Phase 5 |
| BL-10 | Mobile responsive layout | 8 | 🟢 Low | Desktop-first hiện tại |
| BL-11 | PlantUML export endpoint | 3 | 🟢 Low | Nice-to-have |
| BL-12 | ChangeSet conflict check cho ports | 3 | 🟡 Medium | KI-02 |

---

## 6. Sprint Tiếp Theo Được Đề Xuất (Sprint 20)

**Mục tiêu:** Production Readiness

| Task | Points | Mô tả |
|------|--------|-------|
| S20-01 | 5 | `[DevOps]` GitHub Actions: lint + tsc + build + docker push |
| S20-02 | 5 | `[DevOps]` Production Docker Compose với Nginx + SSL template |
| S20-03 | 5 | `[FE]` Dashboard metrics thật: query aggregate servers/apps/deployments count per env |
| S20-04 | 3 | `[FE]` OS Lifecycle update form trong Server Detail |
| S20-05 | 3 | `[BE]` ChangeSet conflict check bổ sung cho port conflicts |
| S20-06 | 3 | `[FE]` Wire GraphQL Subscription vào FE (server status realtime badge) |

**Tổng:** 24 points

---

## 7. Cấu trúc Tài liệu Nội bộ

```
docs/
├── SRS.md                          # System Requirements Specification (đầy đủ)
├── IMPLEMENTATION_DETAILS.md       # Quyết định kỹ thuật theo sprint
├── PROGRESS_LOG.md                 # Nhật ký tiến độ (prepend-only)
├── TASKS.md                        # Sprint tasks + backlog
├── plans/
│   ├── sprint-16-app-group-restructure.md
│   ├── sprint-17-deployment-upload.md
│   ├── sprint-18-multi-port-connection-import.md
│   └── sprint-19-topology-orthogonal-edges.md
└── reports/
    ├── sprint-00-bootstrap.md
    ├── sprint-01.md → sprint-19.md
    └── sprint-template.md          # Template cho sprint mới
```

---

## 8. Hướng dẫn Bắt đầu cho Team Mới

### Bước 1: Đọc tài liệu theo thứ tự
1. [README.md](README.md) — Overview + Quick Start
2. [01_ARCHITECTURE.md](01_ARCHITECTURE.md) — Hiểu hệ thống tổng thể
3. [02_DATA_MODEL.md](02_DATA_MODEL.md) — Hiểu database schema
4. [05_DEVELOPMENT_GUIDE.md](05_DEVELOPMENT_GUIDE.md) — Setup môi trường

### Bước 2: Chạy hệ thống và khám phá
```bash
docker compose up -d
# Truy cập http://localhost:5173
# Login admin@system.local / Admin@123
# Vào trang Topology để xem data demo
# Vào Swagger http://localhost:3000/api/docs để test API
```

### Bước 3: Đọc code những module quan trọng
- **Topology:** `packages/frontend/src/pages/topology/` — phức tạp nhất, hiểu rõ trước
- **Backend pipeline:** `packages/backend/src/common/interceptors/` — AuditLog + Transform
- **Auth:** `packages/backend/src/modules/auth/`
- **GraphQL:** `packages/backend/src/modules/topology/topology.resolver.ts`

### Bước 4: Tạo sprint mới
```bash
git checkout main && git pull
git checkout -b sprint/20
git push -u origin sprint/20
# Tạo file docs/plans/sprint-20-<slug>.md
# Update TASKS.md với tasks mới
```

---

## 9. Contacts & Resources

| Resource | Link |
|----------|------|
| Repository | https://github.com/phan-tuan-thanh/SystemManager |
| Swagger (local) | http://localhost:3000/api/docs |
| GraphQL Playground (local) | http://localhost:3000/graphql |
| Sprint reports | `docs/reports/sprint-NN.md` |
| SRS đầy đủ | `docs/SRS.md` |
