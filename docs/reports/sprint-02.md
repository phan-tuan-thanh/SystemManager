# Sprint 02 — User Management & Role Hierarchy

**Ngày bắt đầu:** 2026-04-09  
**Ngày kết thúc:** 2026-04-10  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý người dùng (User Management) hỗ trợ phân quyền theo vai trò (Roles). Triển khai cơ chế xoá mềm (Soft Delete) và logic tính toán quyền hạn hiệu lực (Effective Roles) dựa trên thứ bậc ưu tiên.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Các Table tương tác chính:**
  - `User`: Lưu thông tin định danh, trạng thái (`ACTIVE`, `DISABLED`) và dấu vết xoá (`deleted_at`).
  - `UserRole`: Bảng trung gian gán vai trò trực tiếp cho User.
- **Role Enum:** `ADMIN`, `OPERATOR`, `VIEWER`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Cơ chế Xoá mềm (Soft Delete)
- **Logic:** Khi gọi API DELETE, trường `deleted_at` được cập nhật thời gian hiện tại thay vì xoá dòng dữ liệu vật lý.
- **Truy vấn:** Toàn bộ các hàm `findAll`, `findOne` trong `UserService` đều bắt buộc filter `deleted_at: null`. Điều này đảm bảo tính toàn vẹn dữ liệu cho các bảng Audit Log và History tham chiếu tới User.

### 3.2. Tính toán Quyền hiệu lực (Role Hierarchy)
- **Thứ tự ưu tiên:** `ADMIN` > `OPERATOR` > `VIEWER`.
- **Luồng xử lý (`getEffectiveRoles`):**
  - Hệ thống lấy toàn bộ roles trực tiếp của User và roles từ các Nhóm (UserGroup) mà user tham gia.
  - Sử dụng logic so sánh: Nếu tập hợp roles chứa `ADMIN`, quyền hiệu lực trả về là `['ADMIN']`. Nếu không có Admin nhưng có Operator, trả về `['OPERATOR']`.
  - Quyền này được dùng để gán vào JWT và kiểm tra tại `RolesGuard`.

### 3.3. Bảo vệ Admin cuối cùng (Last Admin Guard)
- Trong hàm `removeRole`, hệ thống sẽ đếm tổng số User có quyền `ADMIN`. Nếu kết quả bằng 1, hệ thống chặn việc xoá quyền Admin của người dùng cuối cùng để tránh tình trạng hệ thống không còn quản trị viên.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/users` | `GET` | `query`, `page`, `limit` | Tìm kiếm & Phân trang User | `ADMIN` |
| `/users/:id/roles` | `POST` | `{ role: string }` | Gán vai trò cho người dùng | `ADMIN` |
| `/users/:id/reset-password`| `POST` | `{ new_password: string }`| Admin đặt lại pass cho user | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Conflict Register:** Trả về `409 Conflict` nếu email đã tồn tại (bao gồm cả trường hợp đã bị xoá mềm - yêu cầu khôi phục thay vì tạo mới).
- **Password Reset Revoke:** Khi reset mật khẩu, toàn bộ `refreshToken` của User đó trong DB sẽ bị set `revoked_at = NOW()` để buộc tất cả các thiết bị đã đăng nhập phải văng ra.

## 6. Hướng dẫn Bảo trì & Debug

- **Kiểm tra quyền:** Sử dụng `UserService.getEffectiveRoles(id)` để debug nếu user phản hồi không thấy tính năng. Lưu ý kiểm tra cả trạng thái của Nhóm (Group) mà user tham gia (phải là `ACTIVE`).

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 10 (User CRUD, Role Logic, Soft Delete, Admin Security)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
