# Sprint 02 — Quản lý Người dùng & Phân quyền RBAC

**Ngày bắt đầu:** 2026-04-07  
**Ngày kết thúc:** 2026-04-09  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý người dùng tập trung và cơ chế phân quyền dựa trên vai trò (RBAC) kết hợp giữa quyền trực tiếp và quyền theo nhóm.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: UserRole**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `user_id` | `UUID` | ID người dùng | Foreign Key |
| `role` | `Enum` | Quyền (`ADMIN`, `OPERATOR`, `VIEWER`) | Composite Unique (`user_id`, `role`) |

#### **Model: UserGroup**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `code` | `String` | Mã nhóm (VD: 'IT_INFRA') | Unique |
| `default_role` | `Enum` | Quyền mặc định của nhóm | Default: `VIEWER` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Role Resolution)
- **Quyền Hiệu lực (Effective Roles):** Một người dùng có thể có nhiều vai trò. Hệ thống tính toán quyền bằng cách lấy **Hợp (Union)** của:
  1. Các quyền được gán trực tiếp trong bảng `UserRole`.
  2. Các quyền mặc định (`default_role`) của tất cả các Nhóm mà người dùng tham gia.
- **Last-Admin Guard:** Chặn hành động xoá quyền `ADMIN` cuối cùng của hệ thống để tránh tình trạng "mất quyền quản trị".

### 3.2. Tầng Frontend (Admin UI)
- **User Management Table:** Sử dụng component `DataTable` hỗ trợ phân trang server-side, tìm kiếm theo email và lọc theo trạng thái.
- **Role Assignment Modal:** Cho phép Admin bật/tắt các quyền của user thông qua hệ thống Checkbox/Switch.
- **Password Reset:** Admin có thể đặt lại mật khẩu cho user. Khi thực hiện, hệ thống tự động thu hồi (`Revoke`) toàn bộ `RefreshTokens` của user đó để bắt buộc đăng nhập lại.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/users/:id/roles` | `POST` | Gán quyền cho user | `ADMIN` |
| `/user-groups/:id/members` | `POST` | Thêm thành viên vào nhóm | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (User CRUD, Group logic, Effective Role calculation)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
