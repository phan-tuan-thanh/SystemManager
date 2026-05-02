# Sprint 02 — Quản lý Người dùng & Phân quyền RBAC

**Ngày bắt đầu:** 2026-04-07  
**Ngày kết thúc:** 2026-04-09  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý người dùng tập trung và cơ chế phân quyền dựa trên vai trò (RBAC) kết hợp giữa quyền trực tiếp và quyền kế thừa theo nhóm.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: UserRole**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `user_id` | `UUID` | ID người dùng | Foreign Key |
| `role` | `Enum` | Quyền được cấp | `ADMIN`, `OPERATOR`, `VIEWER` |

#### **Model / DTO: UserGroup**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã nhóm (VD: 'IT_INFRA') | `Unique`, `VarChar(50)` |
| `default_role` | `Enum` | Quyền mặc định của nhóm | Default: `VIEWER` |

#### **Hằng số & Enums (Constants & Options)**
- `Role`: Các phân cấp quyền hạn. `ADMIN` (toàn quyền), `OPERATOR` (quyền thao tác ghi, giới hạn), `VIEWER` (chỉ đọc).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Role Resolution Logic:** Backend tính toán "Quyền hiệu lực" (Effective Roles) bằng cách lấy **Hợp (Union)** của các quyền gán trực tiếp (từ `UserRole`) và các quyền kế thừa (từ `default_role` của `UserGroup`).
- **Last-Admin Guard:** Hàm `removeRole` kiểm tra nếu user bị xoá là `ADMIN` cuối cùng trong hệ thống thì ném lỗi 400 Bad Request để ngăn việc hệ thống rơi vào trạng thái "vô chủ".

### 3.2. Tầng Frontend (Client-side Logic)
- **User Management Table:** Sử dụng `DataTable` hỗ trợ phân trang Server-side, có thanh Filter lọc theo trạng thái và tìm kiếm email.
- **Role Assignment UI:** Component `RoleAssignmentModal` cung cấp hệ thống Checkbox/Switch để Admin dễ dàng thêm/bớt Role.
- **Password Reset Flow:** Khi Admin đặt lại mật khẩu cho User, API trả về thành công và Frontend hiển thị mật khẩu tạm thời lên Modal cho Admin sao chép.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/users` | `GET` | Tra cứu danh sách người dùng (Phân trang) | `ADMIN` |
| `/api/v1/users/:id/roles` | `POST` | Cấp thêm quyền cho User | `ADMIN` |
| `/api/v1/users/:id/reset-password` | `POST` | Admin đặt lại mật khẩu của User | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Remove Last Admin (Lỗi 400):** Ném lỗi `BadRequestException` với thông báo rõ ràng "Cannot remove the last ADMIN".
- **Duplicate Role (Lỗi 409):** Nếu cố cấp một quyền mà User đã có trực tiếp, ném lỗi `ConflictException`.

## 6. Hướng dẫn Bảo trì & Debug

- **Log & Trace:** Các thao tác phân quyền và đổi mật khẩu sẽ được ghi nhận vào Audit Log.
- **Gotchas / Chú ý:** Quyền hiệu lực được mã hóa thẳng vào JWT. Do đó, nếu thay đổi nhóm hoặc quyền trực tiếp, quyền mới chỉ có tác dụng sau khi User đăng nhập lại hoặc làm mới token (Refresh).

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (User CRUD, Group logic, Effective Role calculation)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
