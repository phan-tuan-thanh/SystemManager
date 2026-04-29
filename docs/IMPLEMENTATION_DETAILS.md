# Project Implementation Archive

This document consolidates all past implementation plans and detailed technical specifications for major features.

---

## Topology Node Visibility Filter (2026-04-29)

**Status:** ✅ Completed
**Context:** Người dùng cần ẩn/hiện hệ thống (nhóm ứng dụng), server và ứng dụng cụ thể trên sơ đồ topology mà không cần rời trang. Đặc biệt hữu ích khi sơ đồ có nhiều node gây rối.
**Decision:**
- Mở rộng `FilterState` với 3 field mới: `visibleGroupNames: string[]`, `visibleServerIds: string[]`, `visibleAppIds: string[]`. Empty array = show all (no filter applied).
- `TopologyFilterPanel` nhận thêm 3 props options (computed từ topology data). Render 3 `Select mode="multiple"` trong Data Filters section.
- `index.tsx` mở rộng `filteredData` useMemo: sau environment filter, apply visibility filters (server → app group → app). Server không có app nào sau filter sẽ bị drop. Connections filter để chỉ giữ những cặp có cả source lẫn target còn visible.
- Không cần backend change — pure frontend derived state.
**Files impacted:**
- `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` — FilterState + 3 multi-select (update)
- `packages/frontend/src/pages/topology/index.tsx` — options + filteredData extension (update)
**Trade-offs:**
- Filter xảy ra client-side trên toàn bộ dataset đã load — với topology lớn (>500 node) có thể có latency nhỏ trong useMemo. Acceptable vì SRS yêu cầu ≤200 node performance.
- Options dropdown lấy từ dữ liệu hiện tại (theo environment filter hiện tại) — nếu environment filter thay đổi, options tự động cập nhật.
**Sprint plan ref:** `docs/plans/sprint-19-topology-orthogonal-edges.md`
**Outcome:** ✅ 3 multi-select dropdowns (Hệ thống/Servers/Ứng dụng) trong filter bar. filteredData useMemo áp dụng visibility filters. Edges tự động ẩn khi một trong hai đầu không còn visible. 0 TS error mới.
**Completed:** 2026-04-29

---

## Sprint 19 — Topology Orthogonal Edges (2026-04-29)

**Status:** ✅ Completed
**Context:** Topology 2D dùng Bezier curves cho tất cả cạnh. Khi có nhiều kết nối, cạnh chồng lấp và khó đọc. Cần chế độ orthogonal (thẳng góc) dùng `getSmoothStepPath` của ReactFlow.
**Decision:**
- Thêm `edgeStyle: 'bezier' | 'step'` vào `FilterState`. Mặc định `bezier` để không phá vỡ UX cũ.
- `ProtocolEdge` branch theo `data.edgeStyle`: `getBezierPath` (bezier) hoặc `getSmoothStepPath({borderRadius:8})` (step).
- Parallel edges trong step mode: spread bằng `offset` param thay vì `curvature`.
- `buildGraph()` nhận thêm param `edgeStyle` và ghi vào `edge.data.edgeStyle` để `ProtocolEdge` đọc.
- Không cần thay đổi backend, GraphQL, hay schema.
**Files impacted:**
- `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` — thêm `edgeStyle` vào FilterState + Select "Edges" (update)
- `packages/frontend/src/pages/topology/index.tsx` — import `getSmoothStepPath`, dual-mode `ProtocolEdge`, cập nhật `buildGraph`/`computeLayout`, default filter (update)
**Trade-offs:**
- `getSmoothStepPath` offset param shift trục trung tâm của đoạn step giữa — không thể kiểm soát chính xác như Bezier curvature. Với nhiều parallel edges (>5), có thể vẫn giao nhau ở góc đường nếu khoảng cách node quá gần.
- `borderRadius: 8` cho bo tròn nhẹ — nếu muốn góc vuông tuyệt đối đặt `borderRadius: 0`.
**Outcome:** ✅ Filter panel có Select "Edges" (Cong/Thẳng góc). `ProtocolEdge` dual-mode dùng `getSmoothStepPath` khi step, `getBezierPath` khi bezier. Parallel edges spread đúng trong cả 2 chế độ. 0 TS error mới.
**Completed:** 2026-04-29
**Sprint plan ref:** `docs/plans/sprint-19-topology-orthogonal-edges.md`

---

## Sprint 18 — Upload UI Consolidation & Layout Fixes (2026-04-25)

**Status:** ✅ Completed
**Context:** 3 separate upload pages (`/app-upload`, `/deployment-upload`, `/connection-upload`) gây rối UI. Sidebar có 3 menu items riêng khiến navigation phức tạp. Topology page layout bị vỡ: Segmented controls trong title prop bị wrap.
**Decision:**
- Refactor 3 upload pages: extract Content components (app-upload, deployment-upload, connection-upload) từ page wrappers.
- Tạo unified `/app-import` page với Tabs component, quản lý state qua URL param `?tab=app|deployment|connection`.
- Consolidate Sidebar: 3 upload menu items → 1 unified "Import CSV" item.
- Fix topology: di chuyển Segmented controls từ `title` prop (renders <h4 block>) → `extra` prop (uses flex layout).
- Backward compat: old URLs (`/app-upload`, etc.) redirect sang `/app-import?tab=X`.
**Files impacted:**
- `packages/frontend/src/pages/app-upload/index.tsx` — refactor (export Content + default wrapper)
- `packages/frontend/src/pages/deployment-upload/index.tsx` — refactor (export Content + default wrapper)
- `packages/frontend/src/pages/connection-upload/index.tsx` — refactor (export Content + default wrapper)
- `packages/frontend/src/pages/app-import/index.tsx` — new unified page (new)
- `packages/frontend/src/App.tsx` — add `/app-import` route, redirect legacy upload paths (update)
- `packages/frontend/src/components/layout/Sidebar.tsx` — consolidate to 1 menu item, update openKeys (update)
- `packages/frontend/src/pages/topology/index.tsx` — fix layout by moving controls to extra prop (update)
**Trade-offs:**
- Refactoring separates content from wrapper — allows reuse without duplication, maintains backward compat via redirects.
- Topology fix prevents block-level title element from breaking flex layout of inline controls.
**Outcome:** ✅ UI consolidated, navigation simplified. 3 upload pages merged into 1 tabbed interface. Sidebar now shows single "Import CSV" menu. Topology layout fixed.
**Completed:** 2026-04-25

---

## Sprint 18a — Multi-Port per Deployment & Connection Import (2026-04-25)

**Status:** ✅ Completed
**Context:** Sprint 17 hỗ trợ import 1 port/protocol duy nhất mỗi deployment. Thực tế nhiều service (Core Banking, Transaction Engine) expose cả REST lẫn gRPC. Kết nối app-to-app hiện chưa có batch import — phải nhập thủ công.
**Decision:**
- Thêm cột `ports` với format `PORT-PROTOCOL:service_name`, space-separated, thay 3 cột `port`/`protocol`/`service_name`.
- Backward compat: giữ nguyên xử lý single-port (old format) trong cùng validator.
- Thêm `type=connection` vào import pipeline: `importConnection()` upsert AppConnection, resolve `target_port_id` qua Port lookup theo `(app, port_number, environment)`.
- Tạo trang `/connection-upload` theo pattern 4-step wizard đã chuẩn hoá.
**Files impacted:**
- `packages/backend/src/modules/import/import.service.ts` — `parsePortsString()`, `importDeployment()`, `importConnection()` (update)
- `packages/backend/src/modules/import/dto/import-upload.dto.ts` — thêm `connection` vào `@IsIn` (update)
- `packages/backend/src/modules/import/import.controller.ts` — cập nhật Swagger enum (update)
- `packages/frontend/src/pages/deployment-upload/index.tsx` — cập nhật `ports` field (update)
- `packages/frontend/src/pages/connection-upload/index.tsx` — trang mới (new)
- `packages/frontend/src/App.tsx` — thêm route `/connection-upload` (update)
- `packages/frontend/src/components/layout/Sidebar.tsx` — thêm menu item (update)
- `demo/csv/deployments.csv` — format sang `ports` multi-port, thêm gRPC cho CORE_CBS/CORE_TRAN (update)
- `demo/csv/connections.csv` — ~30 kết nối PROD/UAT/DEV (new)
**Trade-offs:**
- `_parsed_ports` là field nội bộ (underscore prefix) trong ImportRow.data — không expose ra API response nhưng đủ để transfer data giữa validateRows và importDeployment trong cùng session.
- Port lookup cho connections không fail nếu port không tồn tại (AC4) — cho phép import connection trước khi deployment đã được import.
**Sprint plan ref:** `docs/plans/sprint-18-multi-port-connection-import.md`

---

## Sprint 17 — Deployment Upload UI (2026-04-25)

**Status:** ✅ Completed
**Context:** Backend đã hỗ trợ `type=deployment` trong import API nhưng chưa có UI. Người dùng phải dùng curl/Postman để import deployment CSV. `importDeployment` luôn `create` mới gây duplicate khi re-import.
**Decision:**
- Tạo trang `/deployment-upload` theo pattern của `app-upload` (4 bước: upload → column map → preview → result)
- Thêm `DEPLOYMENT_HEADER_ALIASES` để backend normalize header CSV variants
- Refactor `importDeployment` sang upsert thủ công: `findFirst` theo (app+server+env) → update/create
**Files impacted:**
- `packages/backend/src/modules/import/import.service.ts` — thêm aliases, upsert logic (update)
- `packages/frontend/src/pages/deployment-upload/index.tsx` — trang mới (new)
- `packages/frontend/src/App.tsx` — thêm route `/deployment-upload` (update)
- `packages/frontend/src/components/layout/Sidebar.tsx` — thêm menu item (update)
**Trade-offs:** Upsert thủ công (không có unique constraint trên AppDeployment) — nếu sau này thêm unique index thì có thể dùng Prisma upsert native thay thế.
**Sprint plan ref:** `docs/plans/sprint-17-deployment-upload.md`
**Outcome:** Trang `/deployment-upload` hoàn chỉnh 4 bước. Backend hỗ trợ upsert và header aliases. Sidebar + route cập nhật.
**Completed:** 2026-04-25

---

## Sprint 16 — Application Group Restructure & Catalog Unification (2026-04-24)

**Status:** ✅ Completed
**Context:** Hai catalog song song (`Application(type=SYSTEM)` và `SystemSoftware`) gây nhầm lẫn; `ApplicationGroup` không có type để phân biệt nhóm nghiệp vụ vs hạ tầng.
**Decision:**
- Thêm `GroupType` enum (`BUSINESS` | `INFRASTRUCTURE`) vào `ApplicationGroup`
- Thêm `eol_date`, `vendor` vào `Application` để đủ thông tin từ `SystemSoftware`
- Copy data `SystemSoftware` → `Application(type=SYSTEM)` qua migration SQL
- Refactor `SystemSoftwareService` → delegate sang `ApplicationService` (backward compatible route `/system-software`)
- Frontend: tách 3 tabs (Nghiệp vụ / Hạ tầng / Nhóm); form `ApplicationForm` lọc nhóm theo context; badge phân loại trong `AppGroupList`
**Files impacted:**
- `packages/backend/prisma/schema.prisma` — thêm enum GroupType, field group_type, eol_date, vendor (update)
- `packages/backend/prisma/migrations/20260424082214_add_group_type_eol_vendor/` — migration (new)
- `packages/backend/prisma/migrations/20260424083000_migrate_system_software_to_applications/` — data migration (new)
- `packages/backend/src/modules/app-group/dto/create-app-group.dto.ts` — thêm group_type required (update)
- `packages/backend/src/modules/app-group/dto/query-app-group.dto.ts` — thêm group_type filter (update)
- `packages/backend/src/modules/app-group/app-group.service.ts` — filter by group_type (update)
- `packages/backend/src/modules/application/dto/create-application.dto.ts` — thêm eol_date, vendor, @IsIn (update)
- `packages/backend/src/modules/application/dto/query-application.dto.ts` — thêm group_type filter (update)
- `packages/backend/src/modules/application/application.service.ts` — validate group_type vs application_type (update)
- `packages/backend/src/modules/application/system-software.service.ts` — delegate sang ApplicationService (update)
- `packages/backend/src/modules/import/import.service.ts` — set group_type khi auto-create (update)
- `packages/frontend/src/types/application.ts` — thêm GroupType, cập nhật Application/ApplicationGroup (update)
- `packages/frontend/src/hooks/useAppGroups.ts` — thêm group_type param (update)
- `packages/frontend/src/hooks/useApplications.ts` — typed application_type, thêm group_type param (update)
- `packages/frontend/src/pages/application/components/AppGroupModal.tsx` — thêm group_type field (update)
- `packages/frontend/src/pages/application/components/AppGroupList.tsx` — badge + filter (update)
- `packages/frontend/src/pages/application/components/ApplicationForm.tsx` — context-aware, SYSTEM fields (update)
- `packages/frontend/src/pages/application/index.tsx` — 3 tabs Nghiệp vụ/Hạ tầng/Nhóm (update)
- `packages/frontend/src/App.tsx` — redirect /system-software (update)
- `packages/frontend/src/components/layout/Sidebar.tsx` — link Phần mềm hạ tầng (update)
**Trade-offs:** `system_software` table giữ nguyên đến Sprint 17 để rollback nếu cần; backward-compatible route `/system-software`
**Sprint plan ref:** `docs/plans/sprint-16-app-group-restructure.md`
**Completed:** 2026-04-24

---

## 1. Advanced Infrastructure CSV Import (Sprint 9)
**Date:** 2026-04-17
**Status:** ✅ Completed

### Objectives
- Allow contextual selection of **Infra System** and **Site**.
- Support **Automatic Detection** of context from CSV content.
- Provide a **CSV Template** for users.
- Implement a **Pre-import Data Preview** table (top 10 rows) using `papaparse`.
- Improve UX by allowing review and adjustment before final submission.

### Technical Implementation
- **Backend Service**: Enhanced `importFromCsv` in `InfraSystemService` to handle optional overrides (`infra_system_id`, `site`, `environment`).
- **Data Mapping**:
  ```typescript
  const effectiveEnv = environment === 'AUTOMATIC' || !environment ? row.Environment : environment;
  const effectiveSite = site === 'AUTOMATIC' || !site ? row.Site : site;
  const effectiveSystem = system_id === 'AUTOMATIC' || !system_id ? row.System : system_id; 
  ```
- **Frontend UI**: Integrated `Papa.parse` for client-side CSV preview. Refactored the import modal to follow a multi-step workflow: Selection -> Preview -> Confirmation.
- **Reporting**: Added detailed import statistics (created/duplicate counts for Apps and Servers) using a tabbed Modal interface.

---

## 2. Topology UI Improvements (Sprint 9)
**Date:** 2026-04-17
**Status:** ✅ Completed

### Features
1. **Collapsible Application Info**:
   - Visual distinction between System apps (gear icon, gray context) and Business apps (standard icon).
   - Collapsible panel for metadata (Server Name, Group, Version).
   - Compact port display with toggleable list.
2. **Direct Connection Creation**:
   - Added a "Connection Mode" toggle in the filter panel.
   - Click source node -> click target node on the diagram to trigger the create connection modal.
   - Built-in validation (same environment check).

### Technical Tasks
- **AppFlowNode.tsx**: Updated to support internal `expanded` and `portsExpanded` states.
- **Topology GraphQL**: Extended schema to include `ports` and `application_type`.
- **React Flow Integration**: Updated `onConnect` handler in `topology/index.tsx` to integrate with `useCreateConnection` hook.

---

## 3. Bulk Delete Records
**Date:** 2026-04-16
**Status:** ✅ Completed

### Objectives
- Implement mass deletion capability for servers, applications, and networks.
- Ensure safety by blocking deletion of `InfraSystem` or `NetworkConfig` if they are still "in use" (linked to active servers/deployments).

### Rules
- **InfraSystem**: Block delete if `servers` count > 0.
- **NetworkConfig**: Block delete if linked to a Server.
- **Soft Delete**: All records use `deleted_at` timestamp rather than hard deletion.

---

## 4. Historical Plan Drafts (Iterative)

### Sprint 9 Core Planning (Initial)
- focus on infrastructure grouping.
- Prisma schema additions for `InfraSystem`, `InfraSystemServer`, and `InfraSystemAccess`.
- Role-based access control for infrastructure systems (ADMIN see all, OPERATORS see assigned).

### UI Refinement Plans
- Resolve scroll issues by changing `overflow: 'hidden'` to `overflow: 'auto'` in `AppLayout.tsx`.
- Adjust standard height calculations for topology canvas to prevent rendering at 0px inside flex containers.

---

## 6. Topology 2D UX Improvements (Sprint 13)
**Date:** 2026-04-22

**Context:** Người dùng phản ánh trải nghiệm tương tác trên Topology 2D chưa đủ mượt: nút Auto Arrange không đảm bảo tất cả node nằm trong view, các nhãn kết nối bị chồng lấp không thể di chuyển, chưa có nút fullscreen, và vị trí node bị reset sau mỗi lần dữ liệu tải lại.

**Decision:**
1. **Auto Arrange + Fit View**: Thay thế `setTimeout(50ms)` bằng `requestAnimationFrame()` lặp 2 lần để đảm bảo React commit xong layout trước khi gọi `fitView({ padding: 0.15, duration: 400 })`. Đồng thời xoá `userPositionsRef` để tất cả node reset về dagre position sau khi sắp xếp.
2. **Draggable Edge Labels**: Mở rộng `ProtocolEdge` component với drag state (`isDragging`, `dragStart` ref). Khi user `onMouseDown` trên nhãn, bắt đầu track `mousemove`/`mouseup` trên document. Tính delta pixel và gọi `data.onLabelMove(dx, dy)`. Offset được lưu trong `edge.data.labelOffsetX`/`labelOffsetY` qua `setEdges`. Sử dụng `setEdgesRef` ref pattern để callback ổn định (không phụ thuộc `setEdges` mới mỗi render).
3. **Drag/Drop Position Preservation**: Thêm `userPositionsRef: Record<nodeId, {x,y}>`. Hàm `handleNodesChange` bắt `change.type === 'position' && change.dragging === false` để ghi nhớ vị trí sau khi user thả node. Khi `computedNodes` thay đổi (refetch), `useMemo` merge `userPositionsRef` vào trước khi `setNodes`, giữ nguyên vị trí đã kéo.
4. **Fullscreen**: Sử dụng Fullscreen API (`requestFullscreen` / `exitFullscreen`) trên `containerRef`. Lắng nghe `fullscreenchange` event để sync `isFullscreen` state. Khi fullscreen, canvas height chuyển sang `100vh`; nút icon đổi giữa `FullscreenOutlined` ↔ `FullscreenExitOutlined`.

**Files impacted:**
- `packages/frontend/src/pages/topology/index.tsx` — tất cả thay đổi UI/UX đều ở đây

**Trade-offs:**
- `useMemo` với side effects là anti-pattern, nhưng giữ nguyên để không thay đổi timing (useEffect render sau paint có thể gây flash). Nếu có vấn đề về flash trong tương lai, chuyển sang `useEffect`.
- Edge label offset chỉ tồn tại trong session; khi reload trang hoặc refetch toàn bộ, offset reset về 0. Đây là behaviour chấp nhận được — nếu cần persistent layout phải lưu DB.
- Node position preservation chỉ theo `node.id` — nếu server/app bị xoá và thêm lại (ID mới), position không còn áp dụng được (tự nhiên reset).

---

## 5. Interactive Topology 2D & Networks Layout (Sprint 13)
**Date:** 2026-04-21

**Context:** Cho phép quản trị viên tương tác trực tiếp tạo/xoá kết nối trên mô hình mạng 2D một cách trực quan, và tối ưu quy trình thao tác chọn port. Thay đổi Layout hiển thị cụm ứng dụng (Networks layout) nằm bên trong Server.
**Decision:** 
- Database: Bổ sung trường `target_port_id` vào `AppConnection`.
- Frontend: Sử dụng cơ chế Subnodes (Parent-Child) của React Flow để phân nhóm Server. Kích hoạt trường kiện `onConnect` cho phép tạo Edge dạng drag-and-drop. Auto-select nếu đích chỉ có 1 port, dùng `CreateConnectionModal` để điền nếu có nhiều ports.
**Files impacted:**
- `schema.prisma`, `AppConnection`, `CreateConnectionDto` — Bổ sung `target_port_id`.
- `TopologyPage.tsx`, `CreateConnectionModal.tsx` — FE logic.
**Trade-offs:** 
Layout Subnodes của React Flow yêu cầu auto-layout layer cha-con thông qua Elkjs/Dagre chính xác để không tràn box.

---

## 7. Topology Floating Filters & UI Polish (Sprint 14)
**Date:** 2026-04-23
**Status:** ✅ Completed

**Context:** Bộ lọc bộ lọc cũ bị ẩn khi vào chế độ Fullscreen và không đồng bộ giữa các engine 2D/3D. Người dùng cần một giao diện nhất quán và luôn truy cập được bộ lọc.

**Technical Implementation:**
1. **Horizontal Floating Bar**: Refactor `TopologyFilterPanel` từ dạng panel bên phải sang thanh ngang cố định ở top. Sử dụng `position: absolute`, `top: 16px`, `left: 50%`, `transform: translateX(-50%)`, `z-index: 1000`.
2. **Global Filter Integration**: Di chuyển state bộ lọc (`filters`) lên `TopologyPage` (parent) và truyền xuống các engine (`Topology2D`, `Topology3D`, `VisNetwork`, `Cytoscape`). Mọi thay đổi bộ lọc lập tức ảnh hưởng đến view hiện tại.
3. **Fullscreen Compatibility**: Sử dụng thuộc tính `getPopupContainer={() => containerRef.current}` của Ant Design cho các `Select` dropdown trong filter. Điều này đảm bảo menu dropdown được render bên trong phần tử đang fullscreen thay vì body, tránh bị che khuất.
4. **Visual Distinction**: Cập nhật CSS cho Server nodes (card chữ nhật, viền đậm) và App nodes (hình viên thuốc/pill, gradient màu theo loại) để dễ dàng phân biệt trên graph.

---

## 8. Server Import & Data Enrichment (Sprint 15)
**Date:** 2026-04-24
**Status:** 🔄 In Progress

**Context:** Đơn giản hóa quy trình import bằng cách tập trung vào Server chi tiết (bỏ qua import hạ tầng chung đã có ở các module khác). Đồng thời bổ sung dữ liệu Hệ điều hành (OS) và thông số phần cứng chi tiết.

**Technical Implementation:**
1. **Database Schema**: Thêm trường `os` (String) vào model `Server`.
2. **Refactored Import Logic**:
   - `ImportService.importServer` được cập nhật để tách biệt OS ra khỏi Description.
   - Parse cột `CPU`, `RAM`, `Total Storage (GB)` trực tiếp từ CSV thành các bản ghi `HardwareComponent` tương ứng với `specs` chuẩn hóa (ví dụ: `{"cores": 4}`, `{"size_gb": 16}`).
3. **Frontend Simplification**: 
   - `InfraUploadPage` được chuyển đổi thành `ServerUploadPage`. 
   - Loại bỏ logic phân tách giữa "Infra" và "Server" import, hardcode `importType = 'server'`.
   - Cập nhật Sidebar menu label thành "Upload Server".
4. **Hardware Specs Display**: Cập nhật `HardwareTab` để hiển thị cột "Thông số" dựa trên dữ liệu JSON trong trường `specs`.
