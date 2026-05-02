# Sprint 00 — Bootstrap Cơ sở hạ tầng & Core Auth

**Ngày bắt đầu:** 2026-04-01  
**Ngày kết thúc:** 2026-04-03  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Thiết lập nền tảng dự án Monorepo, cấu hình cơ sở dữ liệu Prisma và triển khai khung xác thực (Auth Framework) cơ bản.

## 2. Kiến trúc & Schema Database (Architecture)

### 2.1. Cấu trúc bảng (Schema)
- **Model `User`**: Lưu trữ danh tính người dùng.
- **Model `RefreshToken`**: Quản lý phiên làm việc và cơ chế xoay vòng token.
- **Model `UserGroup`**: Phân nhóm người dùng theo phòng ban/chức năng.

### 2.2. Đặc tả các trường (Field Definitions)

#### **Model: User**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `email` | `String` | Email đăng nhập | Unique, VarChar(255) |
| `full_name` | `String` | Tên đầy đủ | VarChar(255) |
| `password_hash` | `String` | Mật khẩu đã băm (bcrypt) | Nullable (cho SSO) |
| `account_type` | `Enum` | Loại tài khoản (`LOCAL` / `MS_365`) | Default: `LOCAL` |
| `status` | `Enum` | Trạng thái (`ACTIVE`, `INACTIVE`, `LOCKED`) | Default: `ACTIVE` |

#### **Model: RefreshToken**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `token_hash` | `String` | Hash của token | Unique |
| `expires_at` | `DateTime` | Ngày hết hạn | Required |
| `revoked_at` | `DateTime` | Ngày thu hồi | Nullable |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (NestJS Foundations)
- **Cấu hình Monorepo:** Sử dụng `npm workspaces` tách biệt `packages/backend` và `packages/frontend`.
- **Global Interceptors:** 
  - `TransformInterceptor`: Tự động bọc mọi response vào object `{ data, message, meta }`.
  - `GlobalExceptionFilter`: Chuẩn hoá lỗi trả về dạng `{ error: { message, statusCode } }`.
- **Database Access:** `PrismaService` kế thừa `PrismaClient` và được đăng ký ở `GlobalModule` để tái sử dụng toàn app.

### 3.2. Tầng Frontend (Vite + React Setup)
- **Axios Interceptor:** 
  - Tự động đính kèm Bearer Token vào Header của mọi request.
  - Logic **Silent Refresh**: Nếu nhận lỗi `401`, interceptor tự động gọi API refresh token và thực hiện lại request cũ mà người dùng không nhận ra.
- **State Management:** Sử dụng **Zustand** để lưu trữ trạng thái đăng nhập (`authStore`) với cơ chế `persist` vào `localStorage`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/auth/login` | `POST` | Đăng nhập hệ thống | `@Public()` |
| `/auth/refresh` | `POST` | Đổi token mới | `@Public()` |

---

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Token Expired:** Trả về `401 Unauthorized` kèm code `TOKEN_EXPIRED`.
- **Invalid Credentials:** Trả về `401` kèm thông báo "Sai tài khoản hoặc mật khẩu".

## 6. Hướng dẫn Bảo trì & Debug

- **Prisma Studio:** Chạy `npx prisma studio` để kiểm tra dữ liệu thô trong DB.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Project init, Database setup, Auth strategy, Axios interceptor)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
