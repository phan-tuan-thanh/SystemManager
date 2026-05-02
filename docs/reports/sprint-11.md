# Sprint 11 — Tích hợp Microsoft 365 OIDC SSO

**Ngày bắt đầu:** 2026-05-03  
**Ngày kết thúc:** 2026-05-05  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cho phép người dùng đăng nhập bằng tài khoản tổ chức Microsoft 365 (Azure AD) và tự động đồng bộ thông tin hồ sơ.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Cấu hình MS365 (SystemConfig Keys)**
| Key | Type | Description |
|---|---|---|
| `MS365_TENANT_ID` | `String` | ID của tổ chức trên Azure |
| `MS365_CLIENT_ID` | `String` | ID ứng dụng đã đăng ký |
| `MS365_REDIRECT_URI` | `String` | Link callback (`/api/v1/auth/ms365/callback`) |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (OAuth2 Flow)
- **Redirect Strategy:** Khi user nhấn Login, Backend sinh ra URL authorize của Microsoft kèm theo `state` bảo mật để tránh tấn công CSRF.
- **Token Exchange:** Tại callback, Backend nhận `code`, sau đó trao đổi lấy `access_token` và `id_token` từ Microsoft.
- **User Provisioning:** Sử dụng thông tin trong `id_token` (email, name) để tìm user local. Nếu không thấy, tự động tạo mới User với loại `MICROSOFT_365`.

### 3.2. Tầng Frontend (SSO Interaction)
- **Login Page Integration:** Bổ sung nút đăng nhập Microsoft với icon đặc trưng.
- **Callback Loading:** Trang `AuthCallbackPage` hiển thị trạng thái đang xử lý và tự động lưu `accessToken` vào store sau khi nhận được từ Backend.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/auth/ms365` | `GET` | Redirect sang Microsoft | `@Public()` |
| `/auth/ms365/callback` | `GET` | Xử lý kết quả từ Microsoft | `@Public()` |

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 7 (OAuth flow, Token exchange, User syncing)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
