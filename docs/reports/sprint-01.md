# Sprint 01 — Hệ thống Xác thực & Phân quyền (Identity)

**Ngày bắt đầu:** 2026-04-03  
**Ngày kết thúc:** 2026-04-06  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng lớp bảo mật cốt lõi cho hệ thống. Triển khai cơ chế xác thực JWT, bảo vệ API và cung cấp giao diện Đăng nhập/Đăng ký chuyên nghiệp cho người dùng.

## 2. Kiến trúc Bảo mật (Security Architecture)

- **Auth Strategy:** JWT (JSON Web Token) với cơ chế Access Token (ngắn hạn) và Refresh Token (dài hạn, lưu DB).
- **Hashing:** Sử dụng `bcrypt` với salt round = 12 để lưu trữ mật khẩu an toàn.
- **RBAC:** Phân quyền dựa trên Role (ADMIN, OPERATOR, VIEWER).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Auth Logic)
- **First Admin Bootstrap:** Một logic đặc biệt tại `AuthService`. Khi hệ thống hoàn toàn trống (không có Admin), người dùng đầu tiên đăng ký sẽ được tự động nâng cấp thành `ADMIN` để khởi tạo hệ thống.
- **JWT Lifecycle:**
  - `login`: Trả về Access Token (để trong Header) và Refresh Token (lưu DB).
  - `refresh`: Sử dụng Refresh Token còn hiệu lực để lấy Access Token mới mà không cần đăng nhập lại.
- **Security Guard:** Sử dụng `JwtAuthGuard` (Global) kết hợp với decorator `@Public()` để mở các route không cần login.

### 3.2. Tầng Frontend (Login/Register Flow)
- **Form Handling:** Sử dụng **Ant Design Form** với rule validation (`required`, `type: email`, `min: 8`).
- **Xử lý SSO:** Tích hợp nút "Sign in with Microsoft 365", điều hướng trực tiếp tới Backend OIDC flow.
- **Auth Store (Zustand):** Lưu trữ thông tin User, Token và trạng thái `isLoggedIn` toàn cục. Tự động xoá sạch dữ liệu khi user chọn Logout hoặc Token hết hạn.
- **Persistence:** Lưu `access_token` vào `localStorage` để duy trì phiên làm việc sau khi reload trang.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng |
|---|---|---|---|
| `/auth/login` | `POST` | `email, password` | Đăng nhập hệ thống |
| `/auth/refresh` | `POST` | `refresh_token` | Lấy Access Token mới |
| `/auth/ms365` | `GET` | N/A | Khởi tạo SSO Microsoft |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Backend:** Trả về `401 Unauthorized` cho sai mật khẩu/email và `403 Forbidden` khi user không đủ quyền truy cập route.
- **Frontend:** Hiển thị thông báo Toast (`message.error`) lấy từ nội dung lỗi trả về của API để user biết chính xác vấn đề (VD: "Tài khoản đang bị khoá").

## 6. Hướng dẫn Bảo trì & Debug

- **Security Check:** Luôn kiểm tra decorator `@Roles()` tại controller để đảm bảo phân quyền đúng.
- **Token Debug:** Có thể copy Access Token vào `jwt.io` để kiểm tra các claim (sub, email, roles).

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 10 (JWT Setup, Bcrypt integration, Login/Register API, Auth Guards, Frontend Login Page)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
