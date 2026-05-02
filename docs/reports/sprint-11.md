# Sprint 11 — Tích hợp Microsoft 365 OIDC SSO

**Ngày bắt đầu:** 2026-05-03  
**Ngày kết thúc:** 2026-05-05  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Nâng cấp tính năng đăng nhập một chạm sử dụng tài khoản doanh nghiệp (SSO) qua Microsoft 365 (Azure AD), đồng bộ tài khoản tự động.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Hằng số & Enums (Constants & Options)**
- Cấu hình bắt buộc lấy từ DB (`SystemConfig`): 
  - `MS365_TENANT_ID`: ID định danh tổ chức Azure.
  - `MS365_CLIENT_ID`: ID ứng dụng Azure App.
  - `MS365_REDIRECT_URI`: Link Callback.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **OAuth2 Authorization Flow:** Khi user vào endpoint authorize, Backend gom các param (Client ID, Redirect URI, Scope) sinh ra URL chuyển hướng sang cổng login của Microsoft.
- **State Security:** Một tham số ngẫu nhiên `state` được sinh ra và mã hoá để chống tấn công CSRF, kèm theo PKCE (nếu có).
- **Callback & Account Sync:** Tại endpoint callback, Backend nhận `code`, gọi API trao đổi lấy Token. Bóc tách thông tin (Email) từ thẻ ID Token.
  - Nếu Email chưa tồn tại: Tạo mới User (Loại `MICROSOFT_365`).
  - Nếu Email đã có (Loại `LOCAL`): Tự động gộp tài khoản (Liên kết `microsoft_id`).

### 3.2. Tầng Frontend (Client-side Logic)
- **SSO Button Integration:** Form Đăng nhập bổ sung thêm khối Divider "Hoặc" và nút "Đăng nhập bằng Microsoft".
- **Callback Wait UI:** Tạo một Route trắng `/auth/callback`. Khi Microsoft điều hướng trả về, component này hiển thị vòng xoay "Đang xác thực...", sau đó nhận Token từ query param (hoặc call API), lưu vào store và chuyển về `/dashboard`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/auth/ms365` | `GET` | Khởi chạy luồng Login (Trả về URL Microsoft) | `@Public()` |
| `/api/v1/auth/ms365/callback` | `GET` | Nhận mã xác nhận và hoàn tất | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **User Denied (Lỗi 403):** Người dùng từ chối cấp quyền trên giao diện Microsoft -> Microsoft trả về `error=access_denied` -> Hệ thống redirect về trang Login kèm thông báo lỗi.
- **Tenant Mismatch (Lỗi 403):** Nếu cấu hình yêu cầu chỉ nhận user nội bộ công ty (Tenant X), mà user dùng tài khoản cá nhân (Live) -> Backend kiểm tra và từ chối.

## 6. Hướng dẫn Bảo trì & Debug

- **Log & Trace:** Login thành công hay thất bại qua SSO đều được ghi nhận action `LOGIN` vào AuditLog.
- **Gotchas / Chú ý:** Khi test ở localhost, nhớ khai báo localhost vào danh sách Redirect URI cho phép trên portal Azure AD.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 7 (OAuth flow, Token exchange, User syncing)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
