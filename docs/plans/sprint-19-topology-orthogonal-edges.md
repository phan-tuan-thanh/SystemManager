# Sprint 19 — Topology Orthogonal Edges & UX Polish

**Mục tiêu:** Bổ sung chế độ kết nối thẳng góc (orthogonal edges) cho Topology 2D, cải thiện khả năng đọc hiểu sơ đồ khi có nhiều kết nối chồng lấp.

**Branch:** `feat/sprint-19-topology-orthogonal-edges`
**Thời gian:** 2026-04-29
**SRS Ref:** 4.5.5

---

## Bối cảnh

Sau Sprint 18, hệ thống topology 2D đã có đầy đủ tính năng import và tương tác. Tuy nhiên khi có nhiều kết nối (đặc biệt ở chế độ "Servers & Apps"), các cạnh Bezier cong có thể chồng lấp và khó đọc. Chế độ orthogonal (thẳng góc) giúp layout nhìn gọn hơn và dễ trace theo đường đi.

ReactFlow cung cấp sẵn `getSmoothStepPath` — không cần cài thêm package.

---

## 1. Orthogonal Edge Style

### 1.1 Thay đổi FilterState

Thêm field `edgeStyle: 'bezier' | 'step'` vào `FilterState` trong `TopologyFilterPanel.tsx`.

### 1.2 UI Control

Thêm Select "Edges" vào filter panel với 2 options:
- `bezier` → "Cong" (giá trị mặc định)
- `step` → "Thẳng góc"

### 1.3 ProtocolEdge — dual path mode

- Import `getSmoothStepPath` từ `reactflow`
- Nếu `data.edgeStyle === 'step'`: dùng `getSmoothStepPath({ borderRadius: 8, offset })` để tạo path góc vuông với bo tròn nhẹ
- Nếu `data.edgeStyle === 'bezier'` (hoặc mặc định): giữ nguyên `getBezierPath` với curvature hiện tại

### 1.4 Parallel edge spread

- Bezier mode: giữ cơ chế curvature-spread hiện tại
- Step mode: dùng `offset` param của `getSmoothStepPath` để spread parallel edges (bước = 24px mỗi edge)

### 1.5 Data pipeline

```
filters.edgeStyle
  → buildGraph(edgeStyle) → edge.data.edgeStyle
  → ProtocolEdge: read data.edgeStyle → chọn path function
```

---

## 2. Files thay đổi

| File | Thay đổi | Type |
|------|----------|------|
| `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx` | Thêm `edgeStyle` vào FilterState + Select UI | update |
| `packages/frontend/src/pages/topology/index.tsx` | Import `getSmoothStepPath`, update `buildGraph`, `computeLayout`, `ProtocolEdge`, filters default | update |

---

## 3. Tasks

| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S19-01 | `[FE]` | Thêm `edgeStyle` vào `FilterState` + Select "Edges" trong `TopologyFilterPanel` | 1 |
| S19-02 | `[FE]` | Import `getSmoothStepPath`, cập nhật `ProtocolEdge` dual-mode + parallel spread | 2 |

**Sprint 19 Total: 3 points**

---

## 4. Checklist

- [x] S19-01: FilterState + Select UI — `TopologyFilterPanel.tsx` thêm `edgeStyle` field + Select "Edges" ✅
- [x] S19-02: ProtocolEdge dual-mode — `index.tsx` import `getSmoothStepPath`, if/else branch, `buildGraph`/`computeLayout` param, `filters` default ✅
