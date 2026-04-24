# Fix: Topology Cytoscape.js — Null `_private` Crash

**Status:** Đã thực hiện — commit `e96b43d` trên branch `fix/topology-cytoscape-null-error`  
**Branch:** `fix/topology-cytoscape-null-error` (branch từ `main`)  
**Mục tiêu:** Loại bỏ hoàn toàn 2 lỗi runtime xảy ra khi xem Topology bằng engine Cytoscape.js.

---

## 1. Triệu chứng

Hai lỗi xuất hiện liên tục trong console khi chọn render engine **Cytoscape** ở trang Topology:

### Lỗi A — RAF loop sau khi instance bị destroy
```
Uncaught TypeError: Cannot read properties of null (reading 'notify')
    at cytoscape.js:12918   ← endBatch → notify
    at cytoscape.js:8580    ← positions
    at cytoscape.js:18036   ← refreshPositions2
    at cytoscape.js:17739   ← refresh2
    at cytoscape.js:17785   ← frame   ← requestAnimationFrame loop
    ...
    at CoseLayout.run
    at TopologyCytoscapeView.tsx:173   ← useEffect → cytoscape({...})
```

### Lỗi B — Mousemove handler sau khi instance bị destroy
```
Uncaught TypeError: Cannot read properties of null (reading 'isHeadless')
    at cytoscape.js:16795   ← Core2.headless
    at cytoscape.js:9141    ← boundingBoxImpl2
    at cytoscape.js:19208   ← checkLabel
    at cytoscape.js:21938   ← mousemoveHandler
```

Cả hai lỗi đều lặp vô hạn qua nhiều frame `requestAnimationFrame` cho đến khi trang được reload.

---

## 2. Phân tích nguyên nhân gốc

### 2.1 Nguyên nhân chính: Animated layout RAF loop (gây cả lỗi A và B)

Cytoscape.js khởi tạo layout ngay trong constructor:

```ts
// TopologyCytoscapeView.tsx (code cũ, dòng 173)
const cy = cytoscape({
  container: containerRef.current,
  elements,
  layout: buildLayoutOptions(layout),  // animate: true → bắt đầu RAF loop
});
```

Khi `layout = 'cose'`, `buildLayoutOptions` trả về `animate: true`. Cytoscape chạy COSE layout bằng vòng lặp `requestAnimationFrame`:

```
CoseLayout.run()
  └─ frame()
       └─ requestAnimationFrame(frame)  ← tự lặp lại vô tận cho đến khi layout xong
            └─ refresh2() → refreshPositions2() → positions() → endBatch() → notify()
```

Khi React cleanup effect (do `elements` hoặc `layout` prop thay đổi):

```ts
return () => {
  cy.destroy();        // ← sets cy._private = null
  cyRef.current = null;
};
```

`cy.destroy()` null-ifies `_private`, nhưng RAF callback đã được schedule từ trước vẫn chạy và cố gọi `cy._private.notify` → **Lỗi A**.

Tương tự, internal `mousemoveHandler` Cytoscape đăng ký trên DOM container vẫn tồn tại trong một khoảng thời gian nhỏ sau destroy, và khi user di chuột → `cy._private.isHeadless` → **Lỗi B**.

**Mô hình thời gian:**

```
t0: useEffect chạy → cytoscape({animate:true}) → RAF loop bắt đầu
t1: elements thay đổi (data refetch) → React schedule re-render
t2: cleanup effect: cy.destroy() → _private = null
t3: RAF callback fires (đã schedule ở t0, t2 chưa kịp cancel) → CRASH
```

### 2.2 Nguyên nhân phụ: Inline callbacks trong deps array (gây destroy/recreate không cần thiết)

```tsx
// index.tsx (dòng 1099–1132)
{viewMode === '2D' && renderEngine === 'cytoscape' && data?.topology && (
  <TopologyCytoscapeView
    ...
    onNodeClick={(payload) => { ... }}   // ← new reference mỗi render
    onEdgeClick={(conn) => { ... }}      // ← new reference mỗi render
  />
)}
```

`useEffect` cũ có deps:

```ts
useEffect(() => { ... }, [elements, layout, onNodeClick, onEdgeClick]);
```

Vì `onNodeClick` và `onEdgeClick` là arrow function tạo inline → mỗi lần parent re-render (ví dụ: subscription event, filter change) tạo ra reference mới → `useEffect` fire lại → destroy + recreate Cytoscape không cần thiết → tăng tần suất xảy ra lỗi A và B.

### 2.3 Nguyên nhân phụ: Thiếu guard trong `layoutstop` callback

```ts
// Code cũ — không check xem instance còn sống không
cy.one('layoutstop', () => {
  cy.fit(undefined, 40);   // ← có thể gọi trên instance đã destroyed
  cy.center();
});
```

---

## 3. Giải pháp đã thực hiện

### 3.1 Dùng synchronous layout khi khởi tạo

**File:** `packages/frontend/src/pages/topology/components/TopologyCytoscapeView.tsx`

Thêm tham số `animated` vào `buildLayoutOptions`:

```ts
function buildLayoutOptions(
  layout: 'dagre' | 'cose' | 'breadthfirst' | 'grid',
  animated = true,
): any { ... }
```

Trong `useEffect`, truyền `animated = false`:

```ts
const cy = cytoscape({
  container: containerRef.current,
  elements,
  layout: buildLayoutOptions(layout, false), // synchronous — không có RAF loop
});

// Fit thủ công sau khi layout synchronous hoàn thành
cy.fit(undefined, 40);
cy.center();
```

Layout synchronous chạy xong ngay trong call stack hiện tại, không schedule RAF → không có RAF nào có thể chạy sau `cy.destroy()`.

### 3.2 Chuyển callbacks sang refs — loại khỏi deps array

```ts
// Callback refs: cập nhật không trigger useEffect re-run
const onNodeClickRef = useRef(onNodeClick);
onNodeClickRef.current = onNodeClick;
const onEdgeClickRef = useRef(onEdgeClick);
onEdgeClickRef.current = onEdgeClick;

// Event handlers dùng ref thay vì closure
cy.on('tap', 'node', (evt) => {
  const raw = evt.target.data('_raw');
  if (raw && onNodeClickRef.current) onNodeClickRef.current(raw);
});

// useEffect deps: loại onNodeClick, onEdgeClick
}, [elements, layout]); // onNodeClick/onEdgeClick intentionally omitted — accessed via refs
```

### 3.3 Stop layout runner trước khi destroy + guard layoutstop

```ts
// Ref lưu layout runner đang chạy (từ autoArrange)
const layoutRunnerRef = useRef<any>(null);

// autoArrange: lưu runner, guard layoutstop bằng identity check
autoArrange: () => {
  const cy = cyRef.current;
  if (!cy) return;
  const runner = cy.layout(buildLayoutOptions(layoutRef.current, true));
  layoutRunnerRef.current = runner;
  runner.run();
  cy.one('layoutstop', () => {
    if (cyRef.current === cy) {   // guard: instance còn sống
      cy.fit(undefined, 40);
      cy.center();
    }
  });
},

// cleanup: stop runner trước destroy
return () => {
  if (layoutRunnerRef.current) {
    try { layoutRunnerRef.current.stop(); } catch (_) {}
    layoutRunnerRef.current = null;
  }
  cy.destroy();
  cyRef.current = null;
};
```

---

## 4. Trade-off & Rủi ro

| Điểm | Trước fix | Sau fix |
|------|-----------|---------|
| Layout init | Animated (đẹp mắt) | Instant (không animate) |
| Auto Arrange | Animated | Vẫn animated (không thay đổi) |
| Crash on refetch | Thường xuyên | Không xảy ra |
| Unnecessary recreate | Mỗi parent render | Chỉ khi `elements` hoặc `layout` thực sự thay đổi |
| Bundle size | Không đổi | Không đổi |

**Rủi ro thấp:** Layout init không animate là tradeoff chấp nhận được — người dùng không để ý sự khác biệt giữa "layout xuất hiện ngay" và "layout animate 400ms". Nếu cần khôi phục animation cho init, có thể thêm `cy.animate({fit: {padding: 40}}, {duration: 300})` sau sync layout — cách này an toàn vì element animation khác với layout RAF loop.

---

## 5. Files thay đổi

| File | Thay đổi |
|------|---------|
| `packages/frontend/src/pages/topology/components/TopologyCytoscapeView.tsx` | Thêm `animated` param vào `buildLayoutOptions`; chuyển callbacks sang refs; thêm `layoutRunnerRef`; fix cleanup; guard layoutstop |

**Không** cần thay đổi:
- `packages/frontend/src/pages/topology/index.tsx` — inline callbacks ở parent không cần memoize vì đã không còn trong deps
- Backend — lỗi hoàn toàn ở frontend rendering layer
- Schema / migration — không liên quan

---

## 6. Kiểm thử

### Manual test checklist

- [ ] Mở trang Topology, chọn engine **Cytoscape**
- [ ] Không có lỗi `notify` hay `isHeadless` trong console
- [ ] Di chuột qua các node/edge → không có lỗi
- [ ] Đổi filter Environment → Cytoscape re-render không crash
- [ ] Đổi Layout (Force ↔ Hierarchical) → không crash
- [ ] Đổi sang React Flow rồi back về Cytoscape → không crash
- [ ] Bấm **Tự động sắp xếp** → layout animate đúng, fit vào viewport
- [ ] Click node → NodeDetailPanel mở
- [ ] Click edge → ConnectionDetailPanel mở
- [ ] Bấm **Làm mới** nhiều lần liên tiếp → không crash

### Hồi quy
- [ ] Engine React Flow: hoạt động bình thường (không bị ảnh hưởng)
- [ ] Engine vis-network: hoạt động bình thường (không bị ảnh hưởng)
- [ ] 3D view: hoạt động bình thường (không bị ảnh hưởng)

---

## 7. Lộ trình merge

```
fix/topology-cytoscape-null-error
  └─ PR → main  (hotfix — không cần sprint branch vì sửa lỗi runtime)
```

Điều kiện merge:
- [ ] Manual test checklist trên hoàn tất
- [ ] Không có TypeScript errors (`tsc --noEmit`)
- [ ] PR reviewed & approved
