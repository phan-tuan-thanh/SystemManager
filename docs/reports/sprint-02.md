# Sprint 02 — Quản lý Người dùng & Phân quyền RBAC

**Ngày bắt đầu:** 2026-04-07  
**Ngày kết thúc:** 2026-04-09  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý người dùng và cơ chế tính toán quyền hạn thực tế (Effective Roles) dựa trên cả User Role và Group Role.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: UserRole**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `user_id` | `UUID` | ID người dùng | Foreign Key |
| `role` | `Enum` | Quyền | `ADMIN`, `OPERATOR`, `VIEWER` |

#### **Model / DTO: UserGroup**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã nhóm | `Unique` |
| `default_role` | `Enum` | Quyền mặc định | Default: `VIEWER` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Effective Roles Calculation:** Hàm `computeEffectiveRoles(userId)` thực hiện query gộp các quyền trực tiếp từ `UserRole` và các quyền mặc định từ tất cả các nhóm (`UserGroup`) mà user tham gia. Sử dụng `Set` để loại bỏ trùng lặp.
- **Soft Delete:** Mọi thao tác xoá User đều thông qua trường `deleted_at`. Query `findUnique` luôn kèm điều kiện `deleted_at: null`.

### 3.2. Tầng Frontend (Client-side Logic)
- **User List Hook:** Sử dụng `useUserList` để fetch dữ liệu phân trang, search và filter theo trạng thái.
- **Normalization:** Hook tự động chuẩn hóa dữ liệu trả về từ Backend (chuyển đổi `user_roles: [{role: '...'}]` thành mảng string `roles: ['...']`).

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/users` | `GET` | Danh sách người dùng | `ADMIN` |
| `/api/v1/users/:id/roles` | `POST` | Gán quyền cho người dùng | `ADMIN` |
| `/api/v1/users/:id/reset-password` | `POST` | Đặt lại mật khẩu | `ADMIN` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useUserList(params)` | `GET /api/v1/users` | Hook fetch danh sách kèm phân trang/search. |
| `useAssignRole()` | `POST /api/v1/users/:id/roles` | Mutation gán quyền mới. |
| `useResetPassword()` | `POST /api/v1/users/:id/reset-password` | Mutation đặt lại mật khẩu tạm thời. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Account Not Active (Lỗi 401):** Trả về khi người dùng đăng nhập vào tài khoản có status `INACTIVE` hoặc `LOCKED`.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Quyền hạn thực tế chỉ được cập nhật vào JWT khi User thực hiện Refresh Token hoặc Đăng nhập lại.

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (User CRUD, Effective role logic, Role assignment UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
