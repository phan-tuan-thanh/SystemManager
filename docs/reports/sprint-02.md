# Sprint 02 — Quản trị Người dùng & Nhóm quyền

**Ngày bắt đầu:** 2026-04-07  
**Ngày kết thúc:** 2026-04-10  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý vòng đời người dùng (User Lifecycle) và cấu trúc phân quyền theo Nhóm (Groups). Đảm bảo quản trị viên có thể cấp phát, thu hồi quyền hạn một cách linh hoạt và an toàn.

## 2. Kiến trúc Dữ liệu (Schema)

- **Model `User`:** Lưu trữ thông tin cơ bản, trạng thái (`ACTIVE`, `LOCKED`, `INACTIVE`) và cơ chế **Soft Delete** (`deleted_at`).
- **Model `UserGroup`:** Định nghĩa các nhóm chức danh (VD: PTUD, VH_APP) kèm theo quyền mặc định (`default_role`).
- **Quan hệ:** Nhiều - Nhiều (`User` <-> `UserGroup`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Access Control Logic)
- **Effective Roles Calculation:** Logic `computeEffectiveRoles` thực hiện hợp nhất (Union) các Role được gán trực tiếp cho User và các Role kế thừa từ tất cả các Nhóm mà User đó tham gia.
- **Admin Protection:** Chặn hành động tự xoá chính mình hoặc tự gỡ quyền ADMIN của mình nếu đó là Admin cuối cùng trong hệ thống.
- **Soft Delete:** Các API xoá người dùng thực chất chỉ cập nhật trường `deleted_at`, đảm bảo dữ liệu lịch sử (Audit Log) không bị mồ côi.

### 3.2. Tầng Frontend (User Management UI)
- **DataTable Component:** Sử dụng một component tuỳ chỉnh bọc ngoài **AntD Table**, hỗ trợ phân trang Server-side, tìm kiếm và lọc trạng thái.
- **Quản lý Role:** Sử dụng **Modal & Popconfirm**. Khi Admin gán/gỡ Role, UI sẽ gọi API tương ứng và cập nhật lại danh sách ngay lập tức thông qua `Invalidate Query` (TanStack Query).
- **Reset Mật khẩu:** Form reset mật khẩu yêu cầu xác nhận mật khẩu trùng khớp (Validator custom) trước khi cho phép gửi request lên backend.
- **Lịch sử Đăng nhập:** Hiển thị danh sách các Refresh Token hiện có trong một Modal, cho phép Admin thu hồi (Revoke) phiên làm việc của user từ xa.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/users` | `GET` | Danh sách người dùng (Pagination/Filter) | `ADMIN` |
| `/users/:id/roles` | `POST` | Gán Role mới cho User | `ADMIN` |
| `/users/:id/reset-password` | `POST` | Đổi mật khẩu bắt buộc | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Conflict:** Trả về `409 Conflict` nếu cố tình tạo User với Email đã tồn tại (kể cả User đã bị xoá mềm).
- **Validation:** Frontend chặn việc submit form nếu Email không đúng định dạng hoặc mật khẩu quá ngắn.

## 6. Hướng dẫn Bảo trì & Debug

- **Audit:** Mọi hành động thay đổi Role/Status đều được ghi vào bảng `AuditLog`.
- **Query Cache:** Frontend sử dụng cache key `['users', filters]`. Khi thay đổi dữ liệu, hãy gọi `queryClient.invalidateQueries({ queryKey: ['users'] })`.

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 9 (User CRUD, Group logic, Soft delete, Role mapping, Frontend Management UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
