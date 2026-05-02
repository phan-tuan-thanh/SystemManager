# Sprint 19 — Topology Orthogonal Edges & Node Visibility Filter

**Ngày bắt đầu:** 2026-04-29  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Nâng cấp trải nghiệm người dùng (UX) trên bản đồ Topology 2D bằng cách hỗ trợ vẽ đường nối thẳng góc (Orthogonal Edges) giúp tránh rối mắt, tự động tách các cạnh song song, và cung cấp bộ lọc hiển thị Node đa tầng (ẩn/hiện tuỳ ý).

## 2. Kiến trúc & Schema Database

*Không có thay đổi về Schema DB. Toàn bộ tính năng thuộc tầng Frontend State Management.*

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Cơ chế vẽ đường nối góc vuông (Orthogonal Edges)
- **Logic:** Khi người dùng chọn `edgeStyle = 'step'`, hệ thống sử dụng hàm `getSmoothStepPath` của ReactFlow thay vì `getBezierPath`.
- **Xử lý cạnh song song (Parallel Edges Spread):** 
  - Khi có nhiều kết nối giữa cùng 1 cặp Node (ví dụ Server A -> Server B nhưng qua nhiều port), các cạnh sẽ đè lên nhau.
  - Hệ thống tính toán chỉ số `offset` dựa trên số lượng cạnh song song và tịnh tiến tọa độ (X/Y) để các cạnh tách rời nhau.
  - Nhãn (Protocol label) luôn được tính toán lại toạ độ để nằm chính giữa cạnh đã dịch chuyển.

### 3.2. Bộ lọc Node Visibility (Ẩn/Hiện Node)
- **Cấu trúc State:** Mở rộng `FilterState` thêm các mảng: `visibleGroupNames`, `visibleServerIds`, `visibleAppIds`.
- **Cơ chế Lọc (Cascade):** 
  - Tại file `index.tsx`, hook `useMemo` sẽ duyệt qua tập dữ liệu Topology gốc.
  - Các AppNode không có trong danh sách `visibleAppIds` sẽ bị loại bỏ. Tương tự với ServerNode.
  - **Auto-hide Edges:** Nếu một trong hai đầu (source/target) của một Connection bị ẩn, hệ thống tự động loại bỏ cạnh đó khỏi Graph để tránh lỗi tham chiếu undefined.

## 4. Đặc tả API Interfaces

*Không có thêm API mới. Sử dụng API GraphQL Subscription hiện có của Topology.*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Lỗi đứt gãy sơ đồ (Orphaned Edges):** ReactFlow sẽ crash nếu truyền vào một Edge có `source` hoặc `target` không tồn tại trong danh sách Nodes. Đã fix bằng filter chéo kiểm tra sự tồn tại của Node trước khi render Edge.

## 6. Hướng dẫn Bảo trì & Debug

- **Debug Edge Position:** Khi thêm engine mới (như Cytoscape), logic tính offset cho song song có thể cần phải tinh chỉnh riêng vì Cytoscape có sẵn `curve-style: bezier` với multiple edges.

---

## 7. Metrics & Tasks (Lịch sử công việc)

### Danh sách Tasks
- ✅ S19-01: Thêm `edgeStyle: 'bezier' | 'step'` vào FilterState + Select "Edges"
- ✅ S19-02: Import `getSmoothStepPath`, spread offset, giữ draggable labels.
- ✅ S19-03: Mở rộng FilterState + 3 multi-select filter panel.
- ✅ S19-04: Compute options linh hoạt theo dữ liệu Topology trả về.

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì._
