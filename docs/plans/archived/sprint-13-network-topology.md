# Kế hoạch triển khai — Sprint 13: Interactive Topology 2D & Networks Layout

**Dự án:** SystemManager
**Mục tiêu:** Nâng cấp Topology 2D với bố cục kiểu mạng lưới (Networks Layout) và cho phép quản trị viên tương tác trực tiếp tạo/xoá kết nối (drag-and-drop edge), tích hợp quy trình gán port linh hoạt.
**Ngày bắt đầu:** 2026-04-21
**Ngày kết thúc dự kiến:** 2026-04-28

---

## 1. Thành phần Backend ([BE])

### 1.1 Khai báo `target_port_id` vào AppConnection
- **Cơ chế:** Database schema bổ sung thêm mapping `target_port_id` cho model `AppConnection`.
- **API Mới / Update:**
  - `PATCH /api/v1/connections/:id` & `POST /api/v1/connections` update DTO payload chấp nhận `target_port_id`.
  - GraphQL API `Topology` trả về thêm thông tin `targetPort` trong connection edges.
- **Files thay đổi:**
  - `packages/backend/prisma/schema.prisma` — Định nghĩa relation mới.
  - `packages/backend/src/modules/connection/*` — DTO validations và Service logic.
  - `packages/backend/src/modules/topology/*` — Bổ sung ObjectType GraphQL.

## 2. Thành phần Frontend ([FE])

### 2.1 Interactive Topology 2D (ReactFlow)
- **Cơ chế:** 
  - Kích hoạt `onConnect` trong `ReactFlow`. Nếu ứng dụng đích chỉ có 1 port, tự động lấy port đó để tạo AppConnection. Nếu có >= 2 ports, mở modal `CreateConnectionModal` để người dùng chọn.
  - Xử lý click xoá Edge bằng context menu hoặc nút "Delete" trong detail panel.
- **Files thay đổi:**
  - `packages/frontend/src/pages/topology/TopologyPage.tsx` — Xử lý events react-flow.
  - `packages/frontend/src/pages/topology/components/CreateConnectionModal.tsx` — Modal cấu hình thông tin mạng.

### 2.2 Layout "Networks" (ReactFlow)
- **Cơ chế:** Tổ chức layout các ứng dụng hiển thị lồng bên trong các khối máy chủ vật lý/máy chủ ảo (Subnet/Server Box) bằng cơ chế Sub Notes (Parent-Child) của React Flow hoặc Elkjs.

## 3. Thành phần Integration / Test ([INT])

- Kiểm thử tính năng phân giải Port tự động và luồng tạo Connection.

---

## 4. Chi tiết tác vụ & Danh sách File tác động

### TASK S13-01 — [BE] Migrate AppConnection target_port_id
- **File:** `schema.prisma`, `migration.sql`

### TASK S13-02 — [BE] Connection API updates
- **File:** `create-connection.dto.ts`, `connection.service.ts`

### TASK S13-03 — [BE] GraphQL Topology updates
- **File:** `entities/topology.entity.ts`, `topology.service.ts`

### TASK S13-04 — [FE] Topology 2D Networks Layout
- **File:** `TopologyPage.tsx`

### TASK S13-05 — [FE] Drag-and-drop edge creation
- **File:** `CreateConnectionModal.tsx`, `TopologyPage.tsx`
