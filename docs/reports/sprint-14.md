# Sprint 14 — Topology Engine & Data Mapping

**Ngày bắt đầu:** 2026-05-03  
**Ngày kết thúc:** 2026-05-04  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ trực quan hoá hệ thống (Topology Engine). Chuyển đổi dữ liệu thô từ cơ sở dữ liệu thành cấu trúc đồ thị (Nodes & Edges) có khả năng tương tác, giúp quản trị viên nắm bắt nhanh chóng cấu trúc hạ tầng phức tạp.

## 2. Kiến trúc & Schema Database (Architecture)

- **Cấu trúc Dữ liệu Đồ thị:**
  - **ServerNode:** Chứa thông tin Server và mảng các bản triển khai ứng dụng bên trong (`deployments`).
  - **ConnectionEdge:** Chứa thông tin kết nối, loại giao thức và port giữa hai ứng dụng.
- **TopologyData Interface:** Cấu trúc chuẩn hóa trả về cho Frontend (`{ servers: ServerNode[], connections: ConnectionEdge[] }`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tổng hợp Dữ liệu Đồ thị (Mass Data Fetching)
- **Logic (`getTopology`):**
  - Thực hiện các truy vấn lồng nhau (`include`) cực sâu để lấy toàn bộ: Server -> Deployment -> Application -> Group -> Ports -> NetworkConfigs.
  - Áp dụng bộ lọc môi trường (`environment`) ngay từ tầng Database để giảm lượng dữ liệu truyền tải.
- **Normalize:** Chuyển đổi dữ liệu từ định dạng quan hệ (Relational) sang định dạng phân cấp (Hierarchical) phù hợp với các thư viện đồ thị như ReactFlow hoặc Vis-network.

### 3.2. Phân tích Phụ thuộc Ứng dụng
- Cung cấp API `getAppDependency` chuyên biệt cho chế độ xem Focus. Cho phép hiển thị chỉ những ứng dụng có liên quan trực tiếp đến một ứng dụng mục tiêu (1-hop neighbors).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Tham số | Chức năng | Quyền |
|---|---|---|---|---|
| `/topology` | `GET` | `?environment=PROD` | Lấy toàn bộ đồ thị môi trường | `VIEWER` |
| `/topology/app/:id`| `GET` | N/A | Lấy phụ thuộc của 1 app | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Circular Dependencies:** Hệ thống hỗ trợ xử lý đồ thị có vòng lặp (VD: App A gọi B, B gọi A) mà không gây treo trình duyệt nhờ cơ chế render của thư viện frontend.
- **Data Integrity:** Chỉ hiển thị các kết nối mà cả Ứng dụng Nguồn và Đích đều đang tồn tại (không bị xoá mềm).

## 6. Hướng dẫn Bảo trì & Debug

- **Performance:** Với hạ tầng > 1000 nodes, khuyến nghị sử dụng bộ lọc môi trường để tối ưu tốc độ render.
- **Layout Engine:** Hiện tại hệ thống đang sử dụng cơ chế sắp xếp mặc định (Dagre), có thể nâng cấp lên ELK Engine trong các sprint sau để có layout thông minh hơn.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Topology Service, Data Interfaces, Mass fetching logic, Environment filtering)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
