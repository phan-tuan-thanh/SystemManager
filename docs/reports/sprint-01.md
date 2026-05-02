# Sprint 01 — Định danh & Xác thực Nâng cao

**Ngày bắt đầu:** 2026-04-04  
**Ngày kết thúc:** 2026-04-06  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai cơ chế khởi tạo Admin đầu tiên (Bootstrap) và logic đăng ký tài khoản nội bộ.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: LoginDto**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `email` | `String` | Email đăng nhập | `isEmail()`, Required |
| `password` | `String` | Mật khẩu | `isString()`, Required |

#### **Model / DTO: RegisterDto**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `email` | `String` | Email | `isEmail()` |
| `full_name` | `String` | Tên | `isString()` |
| `password` | `String` | Mật khẩu | `minLength(6)` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **First-Admin Bootstrap:** Trong `validateUser`, nếu email không tồn tại trong DB, hệ thống gọi `hasAdminUser()`. Nếu trả về `false`, Backend tự động tạo User đó với quyền `ADMIN` và băm mật khẩu (bcrypt 12 rounds).
- **JWT Payload:** Chứa `sub` (userId), `email`, và mảng `roles` (Effective Roles).

### 3.2. Tầng Frontend (Client-side Logic)
- **Initialization Check:** Khi khởi động, App gọi API `/system/status`. Nếu `initialized: false`, hướng dẫn người dùng tới trang Setup để tạo Admin đầu tiên.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Đăng ký User mới | `@Public()` (Yêu cầu hệ thống đã có Admin) |
| `/api/v1/system/status` | `GET` | Kiểm tra trạng thái khởi tạo | `@Public()` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useRegisterMutation()` | `POST /api/v1/auth/register` | Hook đăng ký tài khoản (Dành cho trang đăng ký). |
| `useSystemStatus()` | `GET /api/v1/system/status` | Hook kiểm tra trạng thái khởi tạo hệ thống. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Registration Conflict (Lỗi 409):** Nếu email đã tồn tại, ném `ConflictException`.
- **Invalid Credentials (Lỗi 401):** Nếu thông tin đăng nhập sai hoặc Account không `ACTIVE`.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Cơ chế tạo Admin tự động chỉ hoạt động khi bảng `user_roles` chưa có bất kỳ bản ghi `ADMIN` nào.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (First-admin logic, Registration API, System status check)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
