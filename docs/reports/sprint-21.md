# Sprint 21 Report — Topology Smart Auto-Layout & Collision Avoidance

**Cập nhật:** 2026-04-30
**Branch:** `feat/sprint-21-topology-smart-layout`
**Tổng story points:** 9 / 9 ✅

---

## Tính năng đã implement

### S21-01 — Layout Direction Control (2pts)
- Thêm `layoutDirection: 'TB' | 'BT' | 'LR' | 'RL'` vào `FilterState`
- `computeLayout` và `handleAutoArrange` nhận direction rõ ràng (không còn suy ra từ `layout: 'force'|'hierarchical'`)
- FilterPanel ReactFlow: Segmented 4 hướng (↓TB / ↑BT / →LR / ←RL)
- vis-network giữ nguyên "Auto | Phân cấp" riêng

### S21-02 — ELK Layout Engine (5pts)
- Cài `elkjs@0.11.1` vào workspace root
- Thêm `layoutAlgorithm: 'dagre' | 'elk-layered' | 'elk-force' | 'elk-tree' | 'elk-radial'`
- `applyElkLayout(nodes, edges, algorithm, direction): Promise<Node[]>` async function
- ELK_ALGO_MAP + ELK_DIR_MAP lookup tables
- `handleAutoArrange` async, dispatch sang ELK hoặc dagre dựa trên algorithm
- Fallback về dagre nếu ELK throw
- FilterPanel: Select dropdown 5 algorithms thay vì Segmented

### S21-03 — 8-Direction Collision Avoidance (2pts)
- `handleNodeDragStop` cải thiện: khi phát hiện collision, thử 8 hướng la bàn (N/NE/E/SE/S/SW/W/NW)
- Ring search outward, chọn vị trí free gần nhất theo khoảng cách Euclidean từ điểm thả
- Max 20 ring, step = max(nodeW, nodeH) + GAP

---

## Files thay đổi

| File | Thay đổi |
|------|---------|
| `packages/frontend/package.json` | thêm `elkjs@0.11.1` |
| `packages/frontend/src/pages/topology/index.tsx` | ELK import, ELK_ALGO_MAP, applyElkLayout, handleAutoArrange async, 8-dir collision |
| `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` | Algorithm Select (5 options) + Direction Select (4 options) |

---

## Known Issues
- Không có lỗi mới. Pre-existing TS warnings trong topology đã được fix kèm (dagre @ts-expect-error, typed stableUpdateEdgeLabel).
