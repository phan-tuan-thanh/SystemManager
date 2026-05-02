# Sprint 11 — Tích hợp SSO Microsoft 365 (OIDC)

**Ngày bắt đầu:** 2026-04-27  
**Ngày kết thúc:** 2026-04-28  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai cơ chế đăng nhập một lần (SSO) thông qua tài khoản Microsoft 365. Giúp người dùng trong tổ chức truy cập hệ thống nhanh chóng mà không cần quản lý thêm mật khẩu riêng.

## 2. Kiến trúc SSO (OIDC Flow)

- **Provider:** Microsoft Azure AD (Entra ID).
- **Protocol:** OpenID Connect (OIDC).
- **Library:** `passport-azure-ad` hoặc OAuth2 custom flow.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (SSO Exchange Logic)
- **Token Exchange:** Backend nhận `code` từ Microsoft, đổi lấy `id_token` và `access_token`. Hệ thống giải mã `id_token` để lấy Email người dùng.
- **Account Linking:**
  - Nếu Email đã tồn tại trong hệ thống: Cập nhật trạng thái "Linked with SSO" và cho phép đăng nhập.
  - Nếu Email chưa tồn tại: Tự động tạo tài khoản mới (`Auto-provisioning`) với Role mặc định là `VIEWER`.
- **First Admin Protection:** Nếu đây là user đầu tiên của hệ thống (kể cả qua SSO), họ sẽ được tự động gán quyền `ADMIN`.

### 3.2. Tầng Frontend (SSO UI Logic)
- **Login Button:** Cung cấp nút "Sign in with Microsoft 365" với icon chuẩn.
- **Callback Handling:** Sau khi đăng nhập thành công tại trang Microsoft, user được redirect về Frontend kèm theo JWT token. Frontend bóc tách token và lưu vào `authStore`.
- **Error Mapping:** Nếu SSO thất bại (VD: User chưa được gán quyền trong Azure AD), frontend hiển thị thông báo lỗi chi tiết thay vì chỉ báo "Login failed".

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/auth/ms365` | `GET` | Redirect tới Microsoft Login | `@Public()` |
| `/auth/ms365/callback`| `GET` | Tiếp nhận mã Auth code từ MS | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Insecure Redirect:** Chỉ cho phép redirect về các URL đã được cấu hình trong `allowed_origins`.
- **Email Mismatch:** Nếu email trả về từ SSO trống hoặc không hợp lệ, hệ thống từ chối đăng nhập.

## 6. Hướng dẫn Bảo trì & Debug

- **App Registration:** Đảm bảo `ClientId` và `ClientSecret` trong file `.env` luôn trùng khớp với cấu hình trên Azure Portal.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Azure AD Setup, OIDC Callback logic, Account linking, SSO Button UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
