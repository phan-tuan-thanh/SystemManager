# Sprint 19 — Quản lý Firewall Rule & Phân quyền thao tác

**Ngày bắt đầu:** 2026-05-16  
**Ngày kết thúc:** 2026-05-17  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý tập trung các quy tắc tường lửa (Firewall Rules) và kiểm soát quyền truy cập dựa trên vai trò (RBAC).

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: FirewallRule**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `name` | `String` | Tên gợi nhớ của luật | VarChar(200) |
| `environment` | `Enum` | Môi trường áp dụng | Required |
| `source_zone_id` | `UUID` | Vùng mạng nguồn | Foreign Key |
| `source_ip` | `String` | IP nguồn cụ thể | Nullable |
| `destination_server_id` | `UUID` | Server đích | Foreign Key |
| `action` | `Enum` | `ALLOW` hoặc `DENY` | Default: `ALLOW` |
| `status` | `Enum` | Trạng thái phê duyệt | Default: `PENDING` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Access Control)
- **RBAC Enforcement:** Sử dụng `RolesGuard` để bảo vệ các thao tác thay đổi cấu hình. Chỉ người dùng có quyền `ADMIN` hoặc `OPERATOR` mới có thể tạo/sửa/xoá luật firewall.
- **Data Integrity:** Khi tạo luật, hệ thống kiểm tra sự tồn tại của các tài nguyên liên quan (Zone, Server, Port). Nếu một Server đích bị xoá, các luật liên quan sẽ tự động được đánh dấu `INACTIVE`.

### 3.2. Tầng Frontend (Admin Control)
- **Tag-based Rendering:** Các trường Zone, IP, Server được hiển thị dưới dạng các thẻ màu (Tag) giúp người dùng dễ dàng phân biệt các vùng mạng khác nhau.
- **Conditional Actions:** Frontend tự động ẩn các nút "Delete", "Edit" nếu người dùng hiện tại chỉ có quyền `VIEWER`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/firewall-rules` | `GET` | Danh sách luật firewall | `VIEWER` |
| `/firewall-rules/export` | `GET` | Xuất file XLSX | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Firewall Schema, RBAC logic, Export XLSX)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
