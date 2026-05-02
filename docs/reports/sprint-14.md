# Sprint 14 — Engine Topology 2D & Trực quan hoá kết nối

**Ngày bắt đầu:** 2026-05-03  
**Ngày kết thúc:** 2026-05-05  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng bản đồ tương tác (Interactive Map) hiển thị toàn bộ kiến trúc hệ thống. Cho phép người dùng theo dõi luồng dữ liệu giữa các ứng dụng và máy chủ một cách trực quan nhất.

## 2. Kiến trúc Engine (Topology Architecture)

- **Library:** `ReactFlow` (Core), `Dagre` (Hierarchical layout), `ELKjs` (Advanced layout).
- **Data Transformation:** Quy trình chuyển đổi từ dữ liệu Quan hệ (Relational) sang Graph (Nodes/Edges).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Graph Data Provider)
- **Deep Join Query:** Backend thực hiện truy vấn lồng nhau phức tạp để lấy Server kèm theo Deployments, NetworkConfigs và các Connections liên quan trong một request duy nhất.
- **Normalization:** Chuẩn hoá dữ liệu để gán ID duy nhất cho Node (VD: `server-{id}`, `app-{id}-{serverId}`) tránh xung đột khi một ứng dụng chạy trên nhiều server.

### 3.2. Tầng Frontend (Canvas Rendering Logic)
- **Custom Node Components:**
  - **ServerNode:** Hiển thị Header với thông tin OS/IP và phần thân chứa danh sách các App đang chạy bên trong (`Compound Nodes`).
  - **AppNode:** Hiển thị tên ứng dụng và trạng thái Deployment.
- **Custom Edge (`ProtocolEdge`):** 
  - Hiển thị nhãn Giao thức (HTTP, TCP, DATABASE) ngay trên đường nối.
  - **Parallel Edge Spreading:** Thuật toán tự động tính toán độ cong (Curvature) hoặc độ lệch (Offset) khi có nhiều kết nối song song giữa 2 node, giúp đường nối không bị đè lên nhau.
  - **Draggable Labels:** Người dùng có thể kéo nhãn giao thức đến vị trí bất kỳ để tránh bị che khuất bởi các thành phần khác.
- **Layout Engines:** Hỗ trợ chuyển đổi linh hoạt giữa các thuật toán sắp xếp (Dagre, Elk-Layered, Elk-Radial) để phù hợp với quy mô sơ đồ khác nhau.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/topology` | `GET` | Lấy cấu trúc graph toàn hệ thống | `VIEWER` |
| `/topology/snapshot` | `POST` | Lưu trạng thái sơ đồ hiện tại | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Circular Dependencies:** Thuật toán layout xử lý các vòng lặp kết nối để không làm treo trình duyệt.
- **Empty State:** Khi không có kết nối, hệ thống hiển thị danh sách các server "cô đơn" (Isolated nodes) ở phía dưới sơ đồ.

## 6. Hướng dẫn Bảo trì & Debug

- **Performance:** Với sơ đồ > 500 nodes, nên ưu tiên dùng `ELK-Layered` và tắt các animation animation của đường nối.

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (ReactFlow setup, Dagre integration, Parallel edge logic, Custom Node UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
