# Sprint 11 — Microsoft 365 SSO & Account Linking

**Ngày bắt đầu:** 2026-04-27  
**Ngày kết thúc:** 2026-04-28  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tích hợp đăng nhập một chạm (Single Sign-On) với hệ sinh thái Microsoft 365 / Azure AD. Mục tiêu là tối ưu trải nghiệm người dùng nội bộ và tự động hoá quy trình cấp phát tài khoản (Auto-provisioning).

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **User Model Update:** Thêm trường `microsoft_id` (unique) và chuyển đổi `account_type` thành Enum (`LOCAL`, `MICROSOFT_365`).
- **Refresh Token Table:** Lưu trữ `ip_address` và `user_agent` để quản lý phiên đăng nhập an toàn.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Luồng OIDC Exchange
- **B1:** Frontend chuyển hướng người dùng tới trang xác thực của Microsoft.
- **B2:** Sau khi đăng nhập thành công, Microsoft trả về `code` cho Frontend.
- **B3:** Frontend gửi `code` lên API `/auth/microsoft/login`.
- **B4:** Backend sử dụng `MS365Strategy` để đổi `code` lấy `AccessToken` của Microsoft, sau đó gọi Microsoft Graph API để lấy thông tin Email và ID.

### 3.2. Tự động Liên kết & Cấp phát (Account Linking)
- **Trường hợp 1 (User mới):** Hệ thống tự động tạo User mới với quyền mặc định là `VIEWER`.
- **Trường hợp 2 (User đã có tài khoản Local):** Nếu tìm thấy Email trùng khớp trong DB, hệ thống tự động cập nhật `microsoft_id` vào bản ghi đó (Liên kết tài khoản).
- **Kết quả:** Trả về bộ đôi `JWT AccessToken` và `RefreshToken` chuẩn của hệ thống SystemManager.

### 3.3. Khởi tạo Hệ thống (First Admin)
- Một cơ chế đặc biệt tại `validateUser`: Nếu hệ thống hoàn toàn trống (chưa có bất kỳ Admin nào), người dùng đầu tiên đăng nhập thành công sẽ tự động được gán quyền `ADMIN` để khởi tạo dự án.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/auth/microsoft/url` | `GET` | Lấy URL đăng nhập MS | `@Public()` |
| `/auth/microsoft/login` | `POST` | Đổi code lấy JWT | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Account Disabled:** Nếu tài khoản MS hợp lệ nhưng User tương ứng trong hệ thống đang bị khóa (`status: DISABLED`), API trả về `401 Unauthorized`.

## 6. Hướng dẫn Bảo trì & Debug

- **Cấu hình:** Các tham số `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` được quản lý qua biến môi trường (.env).

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (OIDC Strategy, MS Graph integration, Account linking logic, First Admin bootstrap)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
