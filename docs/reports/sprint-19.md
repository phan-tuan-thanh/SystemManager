# Sprint 19 — Quản lý Firewall Rule & Phân quyền thao tác

**Ngày bắt đầu:** 2026-05-16  
**Ngày kết thúc:** 2026-05-17  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý tập trung các quy tắc tường lửa (Firewall Rules) và kiểm soát an ninh mạng nghiêm ngặt thông qua phân quyền dựa trên vai trò (RBAC).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: FirewallRule**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `name` | `String` | Tên gợi nhớ của luật | `VarChar(200)` |
| `environment` | `Enum` | Môi trường áp dụng | `Required` |
| `source_zone_id` | `UUID` | Vùng mạng nguồn | Foreign Key |
| `source_ip` | `String` | IP nguồn cụ thể (tuỳ chọn) | `Nullable` |
| `destination_server_id` | `UUID` | Server đích nhận kết nối | Foreign Key, `Required` |
| `action` | `Enum` | Hành động xử lý gói tin | `ALLOW`, `DENY` (Default: `ALLOW`) |
| `status` | `Enum` | Trạng thái luật trên thực tế | `PENDING_APPROVAL`, `ACTIVE`, `INACTIVE` |

#### **Hằng số & Enums (Constants & Options)**
- `FirewallAction`: Quyết định tính chất luật cho/cấm.
- `FirewallRuleStatus`: Trạng thái hiệu lực để audit.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **RBAC Enforcement:** Sử dụng `RolesGuard`. API POST/PATCH chỉ mở cho `ADMIN` hoặc `OPERATOR`. API `approveRule` chỉ dành riêng cho `ADMIN`.
- **Referential Integrity Tracking:** Trigger tự động đánh dấu `status` = `INACTIVE` cho luật tường lửa nếu Server đích (`destination_server_id`) bị đánh dấu xóa (Soft delete).

### 3.2. Tầng Frontend (Client-side Logic)
- **Tag-based Rendering:** Các trường Zone, IP, Server được hiển thị trên UI bằng các `Tag` có màu sắc khác nhau, giúp Network Admin dễ dàng hình dung cấu hình.
- **Conditional UI Components:** Nút "Phê duyệt" chỉ render ra màn hình nếu Token giải mã của user hiện tại có chứa quyền `ADMIN`. Nếu là `OPERATOR`, nút bị ẩn đi.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/firewall-rules` | `POST` | Đề xuất luật tường lửa mới | `ADMIN`, `OPERATOR` |
| `/api/v1/firewall-rules/:id/approve` | `PATCH` | Phê duyệt hiệu lực luật | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Forbidden Action (Lỗi 403):** Nếu Operator cố gọi API `approve`, Guard sẽ ném `ForbiddenException`.
- **Target Not Found (Lỗi 404):** `destination_server_id` truyền lên không tồn tại trong Database.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Cẩn trọng với các luật `DENY` mức toàn cục (Source Zone = `null`), nếu không validate có thể gây chặn nhầm hệ thống giám sát.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Firewall Schema, RBAC logic, Export XLSX)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
