# Sprint 19 Report — Topology Orthogonal Edges

**Cập nhật:** 2026-04-29

## Tính năng đã implement

### Topology Orthogonal Edges & Auto-Routing

**SRS Ref:** 4.5.5

**FE thay đổi:**
- `TopologyFilterPanel.tsx` — thêm `edgeStyle: 'bezier' | 'step'` vào `FilterState`; Select "Edges" với 2 option: "Cong" (Bezier) và "Thẳng góc" (Smooth-step)
- `topology/index.tsx` — import `getSmoothStepPath` từ reactflow; `ProtocolEdge` dual-mode path (if `edgeStyle === 'step'` → `getSmoothStepPath({borderRadius:8, offset})`, else → `getBezierPath({curvature})`); parallel edges spread: bezier dùng curvature-spread, step dùng offset-spread (24px/edge); `buildGraph()` + `computeLayout()` thêm param `edgeStyle`; `filters` default `edgeStyle: 'bezier'`; `useMemo` dependency updated

**Acceptance Criteria:**
- ✅ AC1: Filter panel có Select "Edges" — "Cong" / "Thẳng góc"
- ✅ AC2: Khi chọn "Thẳng góc", cạnh render smooth-step với borderRadius=8
- ✅ AC3: Parallel edges spread đúng trong cả 2 chế độ
- ✅ AC4: Protocol label vẫn render đúng vị trí, màu, drag được
- ✅ AC5: 0 TypeScript error mới

## TypeScript

```
Errors in topology files: 0 new errors (all pre-existing)
```

## Known Issues
- Không có
