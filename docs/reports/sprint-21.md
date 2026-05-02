# Sprint 21 — Topology Smart Auto-Layout

**Ngày bắt đầu:** 2026-04-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Bổ sung sức mạnh cho Topology bằng việc tích hợp engine sắp xếp đồ thị ELK (Eclipse Layout Kernel) thay thế cho Dagre, hỗ trợ đổi hướng linh hoạt và cơ chế chống đè (Collision Avoidance) khi kéo thả thủ công.

## 2. Kiến trúc & Schema Database

*Không có thay đổi về Database.*

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tích hợp ELK Engine (`elkjs`)
- **Vấn đề của Dagre:** Thường xếp node quá dàn trải theo hàng ngang, lãng phí diện tích màn hình.
- **Luồng xử lý ELK:** 
  - Khi bấm "Tự động sắp xếp", hệ thống gọi hàm async `applyElkLayout`.
  - Hàm convert cấu trúc ReactFlow Nodes/Edges sang chuẩn JSON của ELK (`children`, `edges`).
  - ELK xử lý thuật toán phân tầng (Layered) dưới nền Web Worker (để không làm đơ UI).
  - Cập nhật lại `position` của từng Node từ kết quả trả về, gọi `fitView` để đưa graph về giữa màn hình.

### 3.2. Chống đè Node 8 Hướng (8-Direction Collision Push)
- Khi người dùng kéo thả (drag) một node A vào vị trí đang bị chiếm bởi node B.
- **Logic Tính toán:** Tại event `onNodeDragStop`:
  - Tìm Bounding Box của Node được kéo thả.
  - Duyệt toàn bộ Node khác để tìm va chạm (Intersect).
  - Nếu va chạm, tính toán khoảng cách Euclidean (Distance) theo 8 hướng (N, NE, E, SE, S, SW, W, NW).
  - Chọn hướng gần nhất để "đẩy" Node B ra xa Node A.

## 4. Đặc tả API Interfaces

*Không có API.*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Fallback Engine:** `elkjs` chạy async, nếu xảy ra lỗi do data cyclic quá phức tạp, hệ thống sẽ log lỗi và tự động fallback (chạy lùi) về engine `dagre` synchronous mặc định để đảm bảo graph vẫn được sắp xếp.

## 6. Hướng dẫn Bảo trì & Debug

- Việc dùng ELK yêu cầu thư viện `elkjs/lib/elk.bundled.js`. Nếu update ReactFlow lên version mới, cần kiểm tra lại cơ chế tương thích kích thước Node (do ELK yêu cầu width/height cố định trước khi layout).

---

## 7. Metrics & Tasks (Lịch sử công việc)

### Danh sách Tasks
- ✅ S21-01: FilterState thêm `layoutAlgorithm` (Dagre|ELK) và `layoutDirection` (TB|LR)
- ✅ S21-02: Cài đặt `elkjs`, viết thuật toán `applyElkLayout` async
- ✅ S21-03: Viết logic 8-direction collision push trong `handleNodeDragStop`

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì._
