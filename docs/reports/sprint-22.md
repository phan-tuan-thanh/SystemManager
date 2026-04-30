# Sprint 22 Report — Topology UX: Auto-Layout Trigger, Cascade Filter & Connection Health

**Cập nhật:** 2026-04-30
**Branch:** `feat/sprint-22-topology-ux`
**Tổng story points:** 10 / 10 ✅

---

## Tính năng đã implement

### S22-01 — Auto-Arrange on Algorithm/Direction Change (2pts)
- `useEffect` watch `filters.layoutAlgorithm` + `filters.layoutDirection`
- Stable ref pattern (`handleAutoArrangeRef`) tránh stale closure
- `isFirstRenderRef` skip trigger lúc mount đầu
- Chỉ trigger khi `renderEngine === 'reactflow'` và `nodes.length > 0`

### S22-02 — Cascade Node Filter (3pts)
- `serverGroupsMap: Record<string, string[]>` — serverId → groupNames[]
- `serverAppsMap: Record<string, string[]>` — serverId → appIds[]
- Tính trong `useMemo` từ `data?.topology?.servers` trong `index.tsx`, truyền vào `FilterPanel`
- `cascadedServerOptions`: lọc server options theo nhóm đã chọn trong modal
- `cascadedAppOptions`: lọc app options theo server đã chọn trong modal
- Section title động: "Servers (trong N hệ thống đã chọn)" / "Ứng dụng (trên N server đã chọn)"

### S22-03 — Connection Health Drawer (5pts)
- `ConnectionHealthDrawer.tsx` (new): component mới
- `analyzeTopologyHealth(servers, connections): HealthIssue[]` exported pure function
- 5 loại vấn đề:
  - 🔴 `CIRCULAR_DEP` — DFS cycle detection (iterative, tránh stack overflow)
  - 🔴 `DEAD_CONNECTION` — target app INACTIVE/STOPPED
  - 🟡 `CROSS_ENV` — kết nối khác môi trường
  - 🟡 `SPOF` — Single Point of Failure (degree ≥ 5)
  - 🔵 `ORPHANED` — app không có kết nối nào
- Badge count (ERROR+WARNING) trên button "Kiểm tra kết nối" trong PageHeader
- Click issue → `onFocusNode(nodeId)` + đóng drawer + switch về ReactFlow engine
- Drawer title hiển thị N lỗi / N cảnh báo / N thông tin

### Bonus — Mermaid Zoom & Auto-fit (ngoài sprint points)
- Zoom/pan cho Mermaid preview (CSS `zoom` property — layout-aware)
- Container tự giãn theo diagram, scroll khi zoom in
- Nút +/- 25% và reset 100%

---

## Files thay đổi

| File | Thay đổi |
|------|---------|
| `topology/index.tsx` | S22-01 useEffect, S22-02 cascade maps, S22-03 state + button + import + drawer |
| `topology/components/TopologyFilterPanel.tsx` | S22-02 cascadedServerOptions + cascadedAppOptions |
| `topology/components/ConnectionHealthDrawer.tsx` | **NEW** — analyzeTopologyHealth() + Drawer UI |
| `topology/components/TopologyMermaidView.tsx` | Zoom CSS zoom + auto-fit container |

---

## Known Issues
- Không có lỗi TS mới trong các file đã thay đổi.
- Pre-existing TS errors trong unrelated files (3D view, changeset) không thay đổi.
