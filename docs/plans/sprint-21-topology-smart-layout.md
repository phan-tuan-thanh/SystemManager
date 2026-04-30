# Sprint 21 — Topology Smart Auto-Layout & Collision Avoidance

**Mục tiêu:** Nâng cấp hệ thống layout cho Topology 2D React Flow: cho phép chọn thuật toán (dagre / ELK), chọn hướng sắp xếp (TB / LR), và cải thiện collision avoidance khi người dùng kéo thả node.

**Branch:** `feat/sprint-21-topology-smart-layout`
**Plan created:** 2026-04-30

---

## 1. [FE] Layout Direction Control — Tách hướng khỏi tên thuật toán *(added 2026-04-30)*

**Yêu cầu:** Hiện tại `layout: 'force'` → direction LR, `layout: 'hierarchical'` → direction TB. Tên này gây nhầm lẫn vì 'force' không thực sự là force-directed layout. Cần tách `layoutDirection: 'TB' | 'LR'` thành control riêng, rõ ràng hơn.

**Story points:** 2

### Thành phần Frontend
- **FilterState:** thêm `layoutDirection: 'TB' | 'LR'` (default `'LR'`)
- **index.tsx:** `computeLayout` và `handleAutoArrange` dùng `filters.layoutDirection` thay vì suy ra từ `layout`
- **TopologyFilterPanel:** thêm Segmented "Hướng: ↓ TB | → LR" chỉ khi React Flow, ẩn khi vis-network/mermaid

### Files thay đổi
- `packages/frontend/src/pages/topology/index.tsx` — update (thêm layoutDirection vào FilterState, computeLayout)
- `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` — update (thêm direction control)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S21-01 | `[FE]` | FilterState: thêm `layoutDirection` + cập nhật computeLayout + FilterPanel direction UI | 2 |

---

## 2. [FE] ELK Layout Engine — Thuật toán sắp xếp mạnh hơn *(added 2026-04-30)*

**Yêu cầu:** dagre tốt cho DAG đơn giản, nhưng với topology phức tạp (nhiều node, nhiều edge song song), ELK (Eclipse Layout Kernel) cho kết quả tốt hơn: tránh chồng cạnh, khoảng cách đều. Thêm `layoutAlgorithm: 'dagre' | 'elk'` cho React Flow.

**Story points:** 5

### Thành phần Frontend
- **Install:** `elkjs` package
- **FilterState:** thêm `layoutAlgorithm: 'dagre' | 'elk'` (default `'dagre'`)
- **index.tsx:** thêm `applyElkLayout(nodes, edges, direction)` async, `handleAutoArrange` gọi ELK khi được chọn
- **TopologyFilterPanel:** thêm Segmented "Thuật toán: Dagre | ELK" khi React Flow active

### Cơ chế kỹ thuật
- `elkjs` chạy async (Web Worker không cần, dùng `elk.bundled.js`)
- ELK layout chỉ trigger khi user bấm "Sắp xếp" (Auto Arrange button) — không chạy trong useMemo
- dagre vẫn là default cho initial load (synchronous)
- ELK options: `algorithm: 'layered'`, `elk.direction: 'DOWN' | 'RIGHT'`, `spacing.nodeNode: 60`

### Files thay đổi
- `packages/frontend/package.json` — thêm `elkjs` dependency (update)
- `packages/frontend/src/pages/topology/index.tsx` — thêm applyElkLayout, update handleAutoArrange (update)
- `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` — thêm algorithm control (update)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S21-02 | `[FE]` | Install elkjs + implement `applyElkLayout` async + thêm Algorithm selector trong FilterPanel | 5 |

---

## 3. [FE] Improved Collision Avoidance on Drag *(added 2026-04-30)*

**Yêu cầu:** Collision detection hiện tại (handleNodeDragStop) chỉ push theo trục Y. Cần push theo cả X và Y, và tìm vị trí thoát gần nhất theo mọi hướng để tránh node chồng lên nhau.

**Story points:** 2

### Thành phần Frontend
- `index.tsx` — cải thiện `handleNodeDragStop`: tìm vị trí free gần nhất theo 8 hướng (N, NE, E, SE, S, SW, W, NW)

### Files thay đổi
- `packages/frontend/src/pages/topology/index.tsx` — update collision logic (update)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S21-03 | `[FE]` | Cải thiện collision avoidance trong handleNodeDragStop: 8-direction push | 2 |

---

## Tổng Sprint 21: 9 points

| Task | Points | Status |
|------|--------|--------|
| S21-01 Layout direction control | 2 | ✅ |
| S21-02 ELK layout engine | 5 | ✅ |
| S21-03 Improved collision avoidance | 2 | ✅ |
