# Sprint 00 — Bootstrap Cơ sở hạ tầng & Core Auth

**Ngày bắt đầu:** 2026-04-01  
**Ngày kết thúc:** 2026-04-03  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Thiết lập nền tảng dự án Monorepo, cấu hình cơ sở dữ liệu Prisma và triển khai khung xác thực (Auth Framework) cơ bản.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: User**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `email` | `String` | Email đăng nhập | `Unique`, `VarChar(255)` |
| `full_name` | `String` | Tên đầy đủ | `VarChar(255)` |
| `password_hash` | `String` | Mật khẩu đã băm (bcrypt) | `Nullable` (cho SSO) |
| `account_type` | `Enum` | Loại tài khoản | `LOCAL` / `MS_365` (Default: `LOCAL`) |
| `status` | `Enum` | Trạng thái | `ACTIVE`, `INACTIVE`, `LOCKED` (Default: `ACTIVE`) |

#### **Model / DTO: RefreshToken**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `token_hash` | `String` | Hash của token | `Unique` |
| `expires_at` | `DateTime` | Ngày hết hạn | `Required` |
| `revoked_at` | `DateTime` | Ngày thu hồi | `Nullable` |

#### **Hằng số & Enums (Constants & Options)**
- `Role`: Quyền hạn hệ thống (`ADMIN`, `OPERATOR`, `VIEWER`).
- `UserStatus`: Trạng thái hoạt động của tài khoản.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Global Interceptors:** Sử dụng `TransformInterceptor` để tự động bọc mọi response vào object `{ data, message, meta }`.
- **Global Exception Filter:** `GlobalExceptionFilter` chuẩn hoá mọi lỗi ném ra thành dạng `{ error: { message, statusCode } }`.
- **Database Access:** `PrismaService` kế thừa `PrismaClient` và được đăng ký ở `GlobalModule` để tái sử dụng toàn app mà không cần import lại nhiều lần.

### 3.2. Tầng Frontend (Client-side Logic)
- **Axios Interceptor & Silent Refresh:** Tự động đính kèm Bearer Token vào Header của mọi request. Nếu nhận lỗi `401`, interceptor tự động gọi API refresh token và thực hiện lại request cũ mà người dùng không nhận ra (Seamless UX).
- **State Management:** Sử dụng **Zustand** (`authStore`) để lưu trữ trạng thái đăng nhập, kết hợp với `persist` middleware để lưu vào `localStorage`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Đăng nhập hệ thống (Local) | `@Public()` |
| `/api/v1/auth/refresh` | `POST` | Cấp mới Access Token từ Refresh Token | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Token Expired (Lỗi 401):** API trả về 401 Unauthorized kèm code `TOKEN_EXPIRED`. FE interceptor bắt mã này để chạy luồng Silent Refresh. Nếu Refresh thất bại, văng lỗi yêu cầu đăng nhập lại.
- **Invalid Credentials (Lỗi 401):** Nếu User nhập sai thông tin, trả về lỗi "Sai tài khoản hoặc mật khẩu". UI hiển thị message AntD màu đỏ.
- **Ngoại lệ FE:** Global Router sẽ redirect về `/login` nếu truy cập các route yêu cầu xác thực mà store chưa có token.

## 6. Hướng dẫn Bảo trì & Debug

- **Log & Trace:** Quá trình đăng nhập chưa được đưa vào AuditLog (sẽ được cập nhật ở Sprint sau) nhưng sẽ lưu vào `UserLoginHistory` (nếu có).
- **Gotchas / Chú ý:** Khi phát triển tính năng cần query DB, luôn sử dụng `PrismaService` từ `PrismaModule` toàn cục, không khởi tạo `new PrismaClient()` lẻ tẻ để tránh rò rỉ kết nối (Connection Leak). Có thể debug DB nhanh bằng cách chạy `npx prisma studio`.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Project init, Database setup, Auth strategy, Axios interceptor)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
