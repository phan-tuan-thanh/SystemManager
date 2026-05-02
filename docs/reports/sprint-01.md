# Sprint 01 — Định danh & Xác thực Nâng cao

**Ngày bắt đầu:** 2026-04-04  
**Ngày kết thúc:** 2026-04-06  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai luồng xác thực nâng cao, bao gồm cơ chế khởi tạo Admin đầu tiên (First Admin Bootstrap) và tích hợp Microsoft 365 OIDC.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Auth Request DTO**
| Field | Type | Description | Validation |
|---|---|---|---|
| `email` | `String` | Email đăng nhập | `isEmail()` |
| `password` | `String` | Mật khẩu | `minLength(6)` |

#### **Auth Response Payload**
| Field | Type | Description |
|---|---|---|
| `access_token` | `String` | JWT ngắn hạn (15m) |
| `refresh_token` | `String` | Token dài hạn (7d) |
| `user` | `Object` | Thông tin profile cơ bản |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Identity Logic)
- **First-Admin Bootstrap:** Khi hệ thống trống (chưa có User), API khởi tạo cho phép tạo user đầu tiên với quyền `ADMIN` mà không cần qua bảo mật thông thường.
- **Account Linking:** Nếu người dùng đăng nhập qua Microsoft 365 và email đã tồn tại ở local, hệ thống tự động liên kết `microsoft_id` vào bản ghi `User` hiện có.
- **JWT Payload:** Token không chỉ chứa `userId` mà còn bao gồm danh sách **Effective Roles** (Quyền thực tế) của người dùng để Frontend có thể phân quyền UI ngay lập tức.

### 3.2. Tầng Frontend (Login Workflow)
- **Redirect Logic:** Sau khi đăng nhập thành công, hệ thống kiểm tra trạng thái `initialized`. Nếu chưa cấu hình, redirect về trang `/setup`, ngược lại về `/dashboard`.
- **SSO Button:** Nút "Sign in with Microsoft 365" kích hoạt luồng redirect tới Azure AD portal và nhận callback tại route `/auth/callback`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/auth/ms365` | `GET` | Khởi động luồng SSO | `@Public()` |
| `/users/me` | `GET` | Lấy thông tin cá nhân | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Bootstrap logic, SSO Integration, JWT enhancement)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
