# Project Progress Log

A chronological record of project milestones, updates, and sprint summaries.

---

## 2026-04-30 — Sprint 23: Network Zone & Firewall Rule Management ✅ Hoàn thành

- Yêu cầu ghi nhận vào SRS.md sections 4.9.1, 4.9.2, 4.9.3
- Sprint plan tạo mới: `docs/plans/sprint-23-network-zone-firewall.md`
- Kế hoạch kỹ thuật: `docs/IMPLEMENTATION_DETAILS.md` (entry Sprint 23)
- Tasks mới: S23-01 đến S23-09 (29 points)
- Nội dung: NetworkZone + ZoneIpEntry BE/FE, FirewallRule BE/FE + import/export XLSX, Firewall Topology view

**Kết quả thực hiện:**
- ✅ S23-01: Prisma schema — NetworkZone + ZoneIpEntry + FirewallRule + 3 enums (NetworkZoneType, FirewallAction, FirewallRuleStatus)
- ✅ S23-02: Migration add_network_zone_firewall_rule applied via SQL trực tiếp
- ✅ S23-03: NetworkZone module — 9 endpoints: CRUD zone + list/add/bulk-import/delete IPs
- ✅ S23-04: FirewallRule module — 7 endpoints: CRUD + POST /import + GET /export (XLSX)
- ✅ S23-05: AppModule đăng ký NetworkZoneModule + FirewallRuleModule
- ✅ S23-06: FE /network-zones — DataTable + ZoneForm modal + ZoneIpDrawer
- ✅ S23-07: FE /firewall-rules — DataTable + FirewallRuleForm Drawer + Import Modal + Export XLSX
- ✅ S23-08: FirewallTopologyView — ReactFlow + dagre layout, Zone/Server/IP nodes, ALLOW(xanh)/DENY(đỏ) edges
- ✅ S23-09: Routes App.tsx + Sidebar menu (GlobalOutlined + SafetyCertificateOutlined)
- Branch: `feat/sprint-23-network-zone-firewall` pushed
- Sprint plan: `docs/plans/sprint-23-network-zone-firewall.md` cập nhật

---

## 2026-04-30 — Sprint 22: Topology UX Enhancements ✅ Hoàn thành

- Yêu cầu ghi nhận vào SRS.md sections 4.5.8, 4.5.9, 4.5.10
- Sprint plan tạo mới: `docs/plans/sprint-22-topology-ux.md`
- Kế hoạch kỹ thuật: `docs/IMPLEMENTATION_DETAILS.md` (entry Sprint 22)
- Tasks mới: S22-01 đến S22-03 (10 points)
- Nội dung: auto-arrange on filter change, cascade filter, connection health drawer

**Kết quả thực hiện:**
- ✅ S22-01: Auto-arrange khi thay đổi layoutAlgorithm/layoutDirection (stable ref + useEffect)
- ✅ S22-02: Cascade filter group→server→app trong FilterPanel modal (serverGroupsMap + serverAppsMap)
- ✅ S22-03: ConnectionHealthDrawer — analyzeTopologyHealth() 5 issue types, Badge count, focus node
- Branch: `feat/sprint-22-topology-ux` pushed
- Sprint plan: `docs/plans/sprint-22-topology-ux.md` cập nhật

---

## 2026-04-30 — Sprint 21: Topology Smart Auto-Layout ✅ Hoàn thành

- Yêu cầu ghi nhận vào SRS.md section 4.5.7
- Sprint plan tạo mới: `docs/plans/sprint-21-topology-smart-layout.md`
- Kế hoạch kỹ thuật: `docs/IMPLEMENTATION_DETAILS.md` (entry Sprint 21)
- Tasks mới: S21-01 đến S21-03 (9 points)
- Nội dung: layoutDirection control, ELK engine, 8-direction collision push

**Kết quả thực hiện:**
- ✅ S21-01: FilterState thêm `layoutAlgorithm` / `layoutDirection`; FilterPanel: Segmented Dagre|ELK + ↓TB|→LR
- ✅ S21-02: `elkjs` installed; `applyElkLayout` async (ELK layered, fallback dagre); handleAutoArrange async
- ✅ S21-03: 8-direction collision push trong handleNodeDragStop (N/NE/E/SE/S/SW/W/NW, nearest by Euclidean dist)
- Bonus: fix pre-existing TS warnings trong topology/index.tsx
- Branch: `feat/sprint-21-topology-smart-layout` pushed
- Sprint plan: `docs/plans/sprint-21-topology-smart-layout.md` cập nhật

---

## 2026-04-30 — Sprint 20: UI/UX Polish ✅ Hoàn thành

- Yêu cầu ghi nhận vào SRS.md section 4.2.4, 4.1.3, 4.6.1
- Sprint plan tạo mới: `docs/plans/sprint-20-ux-polish.md`
- Kế hoạch kỹ thuật: `docs/IMPLEMENTATION_DETAILS.md` (entry Sprint 20)
- Tasks mới: S20-01 đến S20-05 (13 points)
- Nội dung: Dragger+Steps wizard, guide docs, AppGroup bulk delete, HardwareTab KV editor, form layout

**Kết quả thực hiện:**
- ✅ S20-01: `infra-upload/index.tsx` — Dragger + Steps 4-bước wizard (đồng nhất với app-import)
- ✅ S20-02: GuidePage thêm menu "Import CSV"; `import.md` rewrite; `guide_infra.md` bổ sung bước import hàng loạt
- ✅ S20-03: `AppGroupList.tsx` — rowSelection + bulk delete Popconfirm
- ✅ S20-04: `HardwareTab.tsx` — Form.List key-value editor (thay JSON textarea), gợi ý preset key theo loại phần cứng
- ✅ S20-05: `ServerForm`, `ApplicationForm`, `AppGroupModal` — Row/Col 2-column layout
- Branch: `feat/sprint-20-ux-polish` pushed
- Sprint plan: `docs/plans/sprint-20-ux-polish.md`

---

## 2026-04-29 — Sprint 19: Topology Node Visibility Filter ✅ Hoàn thành

- ✅ S19-03: Mở rộng FilterState (`visibleGroupNames`, `visibleServerIds`, `visibleAppIds`) + 3 multi-select trong TopologyFilterPanel
- ✅ S19-04: Compute options từ topology data + mở rộng filteredData useMemo trong index.tsx
- Branch: `feat/sprint-19-topology-orthogonal-edges` (giữ nguyên sprint branch)
- Sprint plan: `docs/plans/sprint-19-topology-orthogonal-edges.md` cập nhật

## 2026-04-29 — Sprint 19: Topology Orthogonal Edges ✅ Hoàn thành

- Yêu cầu ghi nhận vào SRS.md section 4.5.5
- Sprint plan tạo mới: `docs/plans/sprint-19-topology-orthogonal-edges.md`
- Kế hoạch kỹ thuật: `docs/IMPLEMENTATION_DETAILS.md` (entry Sprint 19)
- Tasks mới: S19-01 đến S19-02 (3 points)
- Nội dung: edgeStyle filter, getSmoothStepPath dual-mode, parallel spread

**Kết quả thực hiện:**
- ✅ S19-01: Thêm `edgeStyle: 'bezier' | 'step'` vào FilterState + Select "Edges" trong TopologyFilterPanel
- ✅ S19-02: Import `getSmoothStepPath`, ProtocolEdge dual-mode, parallel spread via offset, buildGraph/computeLayout param, filters default
- Branch: `feat/sprint-19-topology-orthogonal-edges` pushed
- TypeScript: 0 lỗi mới trong các file thay đổi
- Sprint plan: `docs/plans/sprint-19-topology-orthogonal-edges.md` cập nhật

## 2026-04-25 — Sprint 18: Upload UI Consolidation & Topology Layout Fix ✅

- ✅ S18-10: Refactored 3 upload pages — extracted Content components (AppUploadContent, DeploymentUploadContent, ConnectionUploadContent)
- ✅ S18-11: Created `/app-import` unified page — Ant Design Tabs with URL-based state management (`?tab=app|deployment|connection`)
- ✅ S18-12: Fixed topology layout — moved Segmented controls from title → extra prop (prevents <h4 block> from breaking flex)
- Updated Sidebar: 3 upload menu items → 1 unified "Import CSV" item
- Updated App.tsx: added `/app-import` route, redirects for backward compat (`/app-upload` → `/app-import?tab=app`, etc.)
- Branch: `feat/sprint-18-multi-port-connection-import` ready for merge
- Docs: IMPLEMENTATION_DETAILS updated with consolidation details

## 2026-04-25 — Sprint 18: Multi-Port Deployment & Connection Import ✅

- Yêu cầu ghi nhận vào SRS.md sections 4.8.4, 4.8.5
- Sprint plan tạo mới: `docs/plans/sprint-18-multi-port-connection-import.md`
- Tasks mới: S18-01 đến S18-09 (16 points)
- Nội dung: cột `ports` multi-port, trang `/connection-upload`, file demo `connections.csv`

**Kết quả thực hiện:**
- ✅ S18-01: `parsePortsString()` — parse format `PORT-PROTOCOL:service_name` space-separated
- ✅ S18-02: `importDeployment()` — tạo nhiều Port records per deployment, backward compat
- ✅ S18-03: `importConnection()` — upsert AppConnection, resolve `target_port_id`
- ✅ S18-04: `ImportPreviewDto` + controller hỗ trợ `type=connection`
- ✅ S18-05: `deployment-upload` UI — thay 3 cột bằng 1 cột `ports`
- ✅ S18-06: `/connection-upload` — trang 4-step wizard import kết nối app-to-app
- ✅ S18-07: Route + Sidebar menu cho `/connection-upload`
- ✅ S18-08: `deployments.csv` — 56 records, CORE_CBS & CORE_TRAN có 2 ports (HTTP + gRPC 9092/9093)
- ✅ S18-09: `connections.csv` — 30 kết nối PROD/UAT/DEV (GRPC, HTTPS, HTTP)
- Branch: `feat/sprint-18-multi-port-connection-import` pushed

## 2026-04-25 — Sprint 17: Bổ sung Port/Protocol vào Deployment Import ✅

- ✅ S17-06: `importDeployment` — tạo Port record trong transaction cùng với deployment
- ✅ S17-07: Port conflict detection: `(server_id, port_number, protocol)` unique, rollback toàn bộ nếu conflict
- ✅ S17-08: FE column mapper thêm port/protocol/service_name target fields
- ✅ S17-09: `deployments.csv` cập nhật 9 cột, 56 records, tất cả port verified không conflict
- Gap: deploy app lên server phải khai báo port/protocol → đã xử lý đầy đủ

## 2026-04-25 — Sprint 17: Deployment Upload UI ✅ Hoàn thành

- Yêu cầu ghi nhận vào SRS.md section 4.7.4
- Sprint plan tạo mới: `docs/plans/sprint-17-deployment-upload.md`
- Tasks mới: S17-01 đến S17-05 (7 points)
- Nội dung: trang `/deployment-upload`, fix upsert duplicate, header aliases

**Kết quả thực hiện:**
- ✅ S17-01: `DEPLOYMENT_HEADER_ALIASES` — normalize header CSV variants
- ✅ S17-02: `importDeployment` — upsert theo (app+server+env), tránh duplicate
- ✅ S17-03: Trang `/deployment-upload` — 4 bước đầy đủ, inline edit, error table
- ✅ S17-04: Route `/deployment-upload` thêm vào `App.tsx`
- ✅ S17-05: Menu "Upload Deployment" trong Sidebar nhóm Ứng dụng
- Branch: `feat/sprint-17-deployment-upload` pushed
- Sprint plan: `docs/plans/sprint-17-deployment-upload.md`

---

## 2026-04-24: Sprint 16 — App Group Restructure & Catalog Unification ✅ Implemented

- ✅ S16-01: Schema — thêm `GroupType` enum + `group_type` vào `ApplicationGroup`
- ✅ S16-02: Schema — thêm `eol_date`, `vendor` vào `Application`
- ✅ S16-03: Data migration — copy `SystemSoftware` → `Application(type=SYSTEM)`; set `INFRASTRUCTURE` cho nhóm đúng loại
- ✅ S16-04: AppGroup DTO & Service — thêm `group_type` filter + required field khi tạo
- ✅ S16-05: Application DTO & Service — validate group_type vs application_type, xử lý eol_date/vendor
- ✅ S16-06: SystemSoftware endpoint — delegate hoàn toàn sang `ApplicationService`
- ✅ S16-07: Frontend Types & Hooks — thêm `GroupType`, cập nhật `Application` interface, hooks params
- ✅ S16-08: AppGroupModal — thêm field `group_type` (disabled khi edit)
- ✅ S16-09: AppGroupList — badge phân loại + filter dropdown
- ✅ S16-10: ApplicationForm — lọc nhóm theo `application_type`, thêm SYSTEM fields (sw_type, vendor, eol_date)
- ✅ S16-11: Application page — tái cấu trúc thành 3 tabs: Nghiệp vụ / Hạ tầng / Nhóm ứng dụng
- ✅ S16-12: Sidebar & Route — `/system-software` redirect sang `/applications?tab=infra`
- ✅ S16-13: Import service — auto-create group với đúng `group_type`
- Branch: `feat/sprint-16-app-group-restructure`

## 2026-04-24: Sprint 16 — App Group Restructure & Centralized Deployments
**Status:** 🔄 Planning
 
- Lập kế hoạch tái cấu trúc nhóm ứng dụng (Business vs Infra).
- Quy hoạch lại module Deployments để quản lý tập trung và theo dõi thay đổi (Change Management).
- Kế hoạch hợp nhất Catalog phần mềm hệ thống (SystemSoftware) vào Application Catalog.
- Tài liệu: [sprint-16-app-group-restructure.md](docs/plans/sprint-16-app-group-restructure.md)

---

## 2026-04-24: Sprint 15 — Server Import & OS Lifecycle
**Status:** ✅ Completed
 
- Triển khai logic Import Server chi tiết (OS, CPU, RAM, Storage).
- **OS Lifecycle Tracking**: Tách OS thành catalog + bảng `ServerOsInstall` lưu lịch sử cài đặt/nâng cấp.
- Interactive Import: Hỗ trợ người dùng ánh xạ (map) OS từ file CSV vào danh mục hệ thống.
- UI: Bổ sung tab **Vòng đời OS** trong chi tiết Server và cập nhật OS Display trên danh sách.
- Branch: `feat/sprint-15-server-import-enrichment`

---

## 2026-04-23: Sprint 14 — UX Polish & Floating Filters
**Status:** ✅ Completed

- Cải thiện Topology UI: Chuyển bộ lọc sang dạng thanh ngang (Horizontal Bar) luôn hiển thị ở top (kể cả fullscreen).
- Đồng bộ lọc: Áp dụng bộ lọc môi trường và loại node trên tất cả engine (ReactFlow, Cytoscape, Vis-network, 3D).
- UI/UX: Set Vis-network làm engine mặc định, cải thiện phân biệt Server/App nodes.

---

## 2026-04-22: Sprint 13 — Topology 2D UX Improvements
**Status:** ✅ Completed

- Yêu cầu mới ghi nhận vào `SRS.md` section 4.5.4
- Kế hoạch kỹ thuật ghi vào `IMPLEMENTATION_DETAILS.md` mục 6
- Sprint tasks S13-07 đến S13-10 hoàn thành trong `TASKS.md`
- Frontend: Nút fullscreen, kéo nhãn kết nối, giữ vị trí node sau drag, cải thiện auto-arrange fitView.

---

## 2026-04-21: Sprint 13 — Interactive Topology 2D & Networks Layout
**Status:** ✅ Completed

- Yêu cầu mới được ghi nhận vào `SRS.md` section 4.5.3
- Kế hoạch implementation lập tại `IMPLEMENTATION_DETAILS.md` mục 5
- Hệ thống hỗ trợ "Networks Layout" (Server Box) và kéo thả tạo kết nối trực tiếp.
- Backend: Thêm `target_port_id` vào `AppConnection`.

---

## 2026-04-17: Sprint 9 Completion & UI Refinements
**Status:** ✅ Merged to `feature/improve-ui-csv-import`

### Highlights
- **Infrastructure CSV Import**: Complete overhaul with support for System/Site/Env overrides, real-time local preview via `papaparse`, and detailed tabbed results reporting.
- **Access Control**: Implemented `InfraSystemAccess` for granular user/group permissions on infrastructure systems.
- **UI Bug Fixes**:
  - Resolved global scroll issues by modifying `AppLayout` overflow properties.
  - Fixed topology rendering bugs where the canvas would collapse to 0px height.
  - Added "Changed Badge" indicators to list pages.
- **Backend Optimizations**: Fixed `infra_system_id` mapping and `systemCode` undefined errors during bulk imports.

---

## 2026-04-16: Sprint 8 Completion - Topology 2D
**Status:** ✅ Completed

### Highlights
- **Topology 2D Page**: Complete implementation using React Flow.
- **Components**: Custom nodes for Servers (rectangular card) and Apps (pills with gradients).
- **Auto-Layout**: Integrated `dagre` library for automatic node positioning with "Auto Arrange" functionality.
- **Snapshots**: Architecture for saving and restoring full topology states.
- **GraphQL**: Registered global middleware and established the core topology query engine.

---

## Sprint 1–7 Summary: Core Modules
**Status:** ✅ COMPLETE

- **Sprint 1 & 2**: User & Group Management (Backend & Frontend).
- **Sprint 3 & 4**: Server, Hardware, and Network Inventory with IP conflict detection.
- **Sprint 5 & 6**: Application management, Deployments, and a complete File Upload system for deployment documentation.
- **Sprint 7**: App Connections, Dependency Tree visualization, and Audit Log CSV streaming exports.

---

### Sprint History & Reports
Detailed sprint-by-sprint reports can be found in the [docs/reports/](file:///Users/ptud/Documents/Labs/SystemManager/docs/reports/) directory.
