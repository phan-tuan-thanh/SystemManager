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
| `account_type` | `Enum` | Loại tài khoản | `LOCAL` / `MICROSOFT_365` (Default: `LOCAL`) |
| `status` | `Enum` | Trạng thái | `ACTIVE`, `INACTIVE`, `LOCKED` (Default: `ACTIVE`) |

#### **Model / DTO: RefreshToken**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `token_hash` | `String` | Hash của token | `Unique` |
| `expires_at` | `DateTime` | Ngày hết hạn | `Required` |
| `revoked_at` | `DateTime` | Ngày thu hồi | `Nullable` |

#### **Hằng số & Enums (Constants & Options)**
- `Role`: Quyền hạn hệ thống (`ADMIN`, `OPERATOR`, `VIEWER`).
- `UserStatus`: Trạng thái hoạt động (`ACTIVE`, `INACTIVE`, `LOCKED`).
- `AccountType`: Loại định danh (`LOCAL`, `MICROSOFT_365`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Global Interceptors:** Sử dụng `TransformInterceptor` để tự động bọc mọi response vào object `{ data, message, meta }`.
- **Global Exception Filter:** `GlobalExceptionFilter` chuẩn hoá mọi lỗi thành dạng `{ error: { message, statusCode } }`.
- **Database Access:** `PrismaService` kế thừa `PrismaClient` và được đăng ký toàn cục trong `PrismaModule`.

### 3.2. Tầng Frontend (Client-side Logic)
- **Axios Interceptor:** Tự động đính kèm Bearer Token. Catch lỗi 401 để kích hoạt Silent Refresh qua `/auth/refresh`.
- **State Management:** Sử dụng **Zustand** (`useAuthStore`) kết hợp `persist` middleware lưu vào `localStorage`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Đăng nhập hệ thống (Local) | `@Public()` |
| `/api/v1/auth/refresh` | `POST` | Cấp mới Access Token | `@Public()` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `setAuth` | N/A | Hàm trong `useAuthStore` lưu User và Tokens sau login. |
| `setTokens` | N/A | Hàm cập nhật Access/Refresh token sau khi refresh thành công. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Token Expired (Lỗi 401):** Trình chặn Axios tự động refresh. Nếu thất bại, gọi `logout()` và chuyển hướng về `/login`.
- **Invalid Credentials (Lỗi 401):** Hiển thị thông báo "Invalid credentials" từ Backend trả về.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Luôn sử dụng `PrismaService` từ module, tránh khởi tạo thủ công client để không bị rò rỉ kết nối.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Project init, Database setup, Auth strategy, Interceptors)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
