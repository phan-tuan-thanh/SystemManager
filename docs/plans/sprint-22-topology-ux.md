# Sprint 22 — Topology UX: Auto-Layout Trigger, Cascade Filter & Connection Health

**Mục tiêu:** 3 cải tiến UX cho Topology 2D: tự động sắp xếp khi đổi thuật toán, lọc node cascade (group→server→app), và panel đánh giá chất lượng kết nối.

**Branch:** `feat/sprint-22-topology-ux`
**Plan created:** 2026-04-30

---

## 1. [FE] Auto-Arrange on Algorithm/Direction Change *(added 2026-04-30)*

**Yêu cầu:** Khi thay đổi dropdown Thuật toán hoặc Hướng, tự động trigger sắp xếp lại, không cần bấm nút "Sắp xếp".

**Story points:** 2

### Thành phần Frontend
- `index.tsx`: thêm `useEffect` với `handleAutoArrangeRef` (stable ref pattern) watch `filters.layoutAlgorithm` + `filters.layoutDirection`; skip initial mount bằng `isMountedRef`; chỉ trigger khi `renderEngine === 'reactflow'` và graph có nodes.

### Files thay đổi
- `packages/frontend/src/pages/topology/index.tsx` — update (S22-01)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S22-01 | `[FE]` | Auto-arrange khi thay đổi layoutAlgorithm/layoutDirection trong ReactFlow | 2 |

---

## 2. [FE] Cascade Node Filter (Group → Server → App) *(added 2026-04-30)*

**Yêu cầu:** Khi chọn Hệ thống trong modal lọc node, danh sách Server chỉ hiện server liên quan; khi chọn Server, danh sách App chỉ hiện app trên server đó.

**Story points:** 3

### Thành phần Frontend
- `TopologyFilterPanel.tsx`: thêm prop `topologyServers: ServerNode[]`; tính `cascadedServerOptions` và `cascadedAppOptions` bên trong modal dựa trên `localGroupNames` / `localServerIds`.
- `index.tsx`: truyền `topologyServers={filteredData.servers}` vào FilterPanel.

### Files thay đổi
- `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` — update (S22-02)
- `packages/frontend/src/pages/topology/index.tsx` — update props (S22-02)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S22-02 | `[FE]` | FilterPanel: cascade filter group→serverOptions→appOptions trong modal | 3 |

---

## 3. [FE] Connection Health Check Drawer *(added 2026-04-30)*

**Yêu cầu:** Button "Kiểm tra kết nối" mở Drawer phân tích topology và liệt kê các vấn đề phân loại theo mức độ.

**Story points:** 5

### Thành phần Frontend
- `ConnectionHealthDrawer.tsx` (new): nhận `servers` + `connections` + `onFocusNode(id)`; `analyzeTopologyHealth()` trả `Issue[]`; phân loại ERROR/WARNING/INFO; click → focus node trên graph.
- 5 loại vấn đề:
  - 🔴 ERROR — Circular dependency (DFS cycle detection)
  - 🔴 ERROR — Dead connection (target app INACTIVE/STOPPED)
  - 🟡 WARNING — Cross-environment connection
  - 🟡 WARNING — Single Point of Failure (degree ≥ 5)
  - 🔵 INFO — Orphaned app (không có kết nối nào)
- `index.tsx`: thêm state `healthDrawerOpen`, button "Kiểm tra" với Badge count issues, truyền `onFocusNode={setFocusedNodeId}`.

### Files thay đổi
- `packages/frontend/src/pages/topology/components/ConnectionHealthDrawer.tsx` — new (S22-03)
- `packages/frontend/src/pages/topology/index.tsx` — thêm button + state (S22-03)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S22-03 | `[FE]` | ConnectionHealthDrawer: analyzeTopologyHealth + 5 issue types + focus node | 5 |

---

## Tổng Sprint 22: 10 points

| Task | Points | Status |
|------|--------|--------|
| S22-01 Auto-arrange on filter change | 2 | ✅ |
| S22-02 Cascade filter | 3 | ✅ |
| S22-03 Connection health drawer | 5 | ✅ |
