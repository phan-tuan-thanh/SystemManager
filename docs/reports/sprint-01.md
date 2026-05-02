# Sprint 01 — Định danh & Xác thực Nâng cao

**Ngày bắt đầu:** 2026-04-04  
**Ngày kết thúc:** 2026-04-06  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai luồng xác thực nâng cao, bao gồm cơ chế khởi tạo Admin đầu tiên (First Admin Bootstrap) và liên kết tài khoản (Account Linking).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Auth Request DTO**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `email` | `String` | Email đăng nhập | `isEmail()`, Required |
| `password` | `String` | Mật khẩu | `minLength(6)`, Required |

#### **Model / DTO: Auth Response Payload**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `access_token` | `String` | JWT ngắn hạn | Hạn sử dụng: 15m |
| `refresh_token` | `String` | Token dài hạn | Hạn sử dụng: 7d |
| `user` | `Object` | Thông tin profile cơ bản | Cắt bỏ password_hash |

#### **Hằng số & Enums (Constants & Options)**
- `JWT_SECRET`: Khóa mã hóa cho JWT Access Token.
- `JWT_REFRESH_SECRET`: Khóa mã hóa cho Refresh Token.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **First-Admin Bootstrap:** Kiểm tra số lượng bản ghi trong bảng `User`. Nếu hệ thống trống (0 user), API khởi tạo cho phép tạo user đầu tiên với quyền `ADMIN` mà không cần qua bảo vệ `JwtAuthGuard`.
- **JWT Payload Injection:** Token JWT được mã hóa không chỉ chứa `userId` mà còn bao gồm danh sách **Effective Roles** (Quyền thực tế) của người dùng để giảm bớt query DB ở các request sau.

### 3.2. Tầng Frontend (Client-side Logic)
- **Redirect Logic:** Sau khi đăng nhập thành công, App Component kiểm tra trạng thái `initialized` từ store. Nếu hệ thống chưa thiết lập xong, tự động redirect về trang `/setup`. Nếu đã xong, chuyển về `/dashboard`.
- **Initialization Wizard:** Tại `/setup`, người dùng trải qua các bước cấu hình ban đầu (Tạo Admin, Khởi tạo dữ liệu cơ bản).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Đăng ký tài khoản (First Admin) | `@Public()` (Nếu system empty) |
| `/api/v1/users/me` | `GET` | Lấy profile user hiện tại | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **System Already Initialized (Lỗi 403):** Nếu hệ thống đã có User mà có kẻ tấn công cố gọi API tạo First Admin, ném lỗi 403 Forbidden.
- **Account Locked (Lỗi 403):** Nếu User có status = `LOCKED`, chặn đăng nhập ngay ở tầng Strategy.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi đổi thuật toán JWT hoặc Secret Key, tất cả Access Token hiện tại sẽ bị vô hiệu. Hãy đảm bảo quy trình thông báo đăng nhập lại.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Bootstrap logic, Payload enhancement)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
