# Sprint 01 — Auth, User Group & System Interceptors

**Ngày bắt đầu:** 2026-04-07  
**Ngày kết thúc:** 2026-04-08  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng nền tảng cốt lõi về Xác thực (Authentication), Phân quyền (Authorization), Quản lý Nhóm người dùng (User Group), và chuẩn hoá định dạng API Response/Error cho toàn bộ backend SystemManager. Đây là foundation bắt buộc trước khi phát triển các module nghiệp vụ khác.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Các Table tương tác chính:**
  - `User`: Quản lý tài khoản. Trường quan trọng: `password` (hashed bằng bcrypt), `refresh_token` (hashed bcrypt để chống đánh cắp DB), `deleted_at` (soft delete).
  - `Role`: Enum (`ADMIN`, `OPERATOR`, `VIEWER`).
  - `UserGroup`: Nhóm chức năng, chứa `default_role`.
  - `UserGroupMember`: Bảng trung gian n-n nối User và UserGroup.
  - `UserLoginHistory`: Bảng ghi nhận lịch sử đăng nhập (IP, UserAgent).
- **Quan hệ (Relations):**
  - `User` (1) - (n) `UserGroupMember` - (1) `UserGroup`

## 3. Luồng xử lý kỹ thuật & Business Logic (Technical Workflow)

### 3.1. Luồng Xác thực (Authentication Flow)
- **Login (`POST /auth/login`):**
  - Client truyền email/password.
  - Sử dụng Passport `LocalStrategy` để validate. Mật khẩu được so khớp qua `bcrypt.compare`.
  - Nếu thành công, sinh `access_token` (JWT short-lived) và `refresh_token` (JWT long-lived).
  - Ghi nhận `UserLoginHistory` (thu thập qua `req.ip` và header `User-Agent`).
  - `refresh_token` được hash (bcrypt) một lần nữa và lưu vào DB trường `refresh_token` để đảm bảo bảo mật.
- **Refresh Token (`POST /auth/refresh`):**
  - Decode token gửi lên, trích xuất `userId`.
  - Fetch hashed refresh_token từ DB, so sánh bằng `bcrypt.compare`. Nếu khớp, cấp phát cặp token mới.
- **Revoke Tokens (Logout / Change Password):**
  - Xóa trắng trường `refresh_token` (set null) trong DB. Các JWT Access Token cũ sẽ tự hết hạn.

### 3.2. Cơ chế Phân quyền (RBAC - Role Based Access Control)
- **Tính toán Quyền hiệu lực (Effective Roles):**
  - Quyền hạn cuối cùng của user không chỉ nằm ở `User.roles` (direct roles) mà còn là phép **Union (hợp)** với `UserGroup.default_role` của tất cả các nhóm mà user tham gia.
  - Phép toán này được thực hiện tại thời điểm Login. Mảng Roles kết quả được serialize thẳng vào payload của JWT.
- **`JwtStrategy` & `RolesGuard`:**
  - `JwtAuthGuard` được kích hoạt **Global** tại `main.ts`. Mọi API đều yêu cầu token trừ khi có decorator `@Public()`.
  - Tại Controller/Route, sử dụng decorator `@Roles(Role.ADMIN, Role.OPERATOR)`.
  - `RolesGuard` sẽ trích xuất roles từ JWT payload (thông qua `req.user`) và so khớp với metadata. Nếu không thoả mãn -> ném `ForbiddenException`.

### 3.3. Chuẩn hoá API (Global Filters & Interceptors)
- **`TransformInterceptor`:** Tự động wrap mọi response thành chuẩn `{ "data": <payload>, "statusCode": 20X, "message": "..." }`.
- **`GlobalExceptionFilter`:**
  - Bắt toàn bộ lỗi (Unhandled Exceptions).
  - Nếu là lỗi Prisma (`PrismaClientKnownRequestError` - ví dụ Unique Constraint violation), filter tự động dịch sang HTTP 409 Conflict hoặc 404 Not Found với format JSON chuẩn.
  - Xoá log rác (stack trace) khi ở môi trường PROD.

## 4. Đặc tả API Interfaces (Key APIs)

| Endpoint | Method | Params / Payload | Response / Chức năng chính | Quyền hạn |
|---|---|---|---|---|
| `/auth/login` | `POST` | `email`, `password` | Trả về `accessToken`, `refreshToken`, `user` | `@Public()` |
| `/auth/refresh` | `POST` | `refreshToken` | Cấp token mới | `@Public()` |
| `/auth/logout` | `POST` | (Header Authorization) | Revoke token | Kèm Token |
| `/auth/change-password`| `POST` | `oldPassword`, `newPassword` | Đổi pass, revoke token, force re-login | Kèm Token |
| `/users/:id/reset-password` | `POST` | `newPassword` | Đổi pass cho user khác | `ADMIN` |
| `/user-groups/:id/members`| `POST` | `{ userIds: string[] }` | Bulk add users vào group | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Soft Delete Conflict:** Bảng User dùng soft delete (`deleted_at`). Khi tạo mới user nếu trùng email đã bị xoá mềm, hệ thống sẽ ném lỗi Conflict và yêu cầu Admin kích hoạt lại user cũ thay vì insert chèn gây lỗi unique DB.
- **Refresh Token Reuse Attack:** `refresh_token` trong DB bị xoá ngay sau khi user logout hoặc đổi pass. Nếu hacker dùng token cũ sau thời điểm đó sẽ bị từ chối do bcrypt compare DB trả về false.
- **UserGroup Guard:** Module UserGroup **không** dùng `ModuleGuard` vì đây là tính năng lõi (Core) giống như User, nó luôn phải hoạt động bất kể `ModuleConfig` bật tắt ra sao.

## 6. Hướng dẫn Bảo trì & Debug (Maintenance Guide)

- **Debug Phân quyền (403 Forbidden):** Nếu user than phiền không có quyền, hãy decode JWT access_token của họ tại jwt.io để xem trường `roles`. Nếu thiếu quyền, hãy kiểm tra lại bảng trung gian `UserGroupMember`. Quyền chỉ được cập nhật sau khi user **re-login** (do lưu vào JWT payload).
- **Log Đăng nhập:** Kiểm tra bảng `UserLoginHistory` để xem user có bị brute-force không. Mọi hành vi `POST /auth/login` thất bại hiện tại sẽ trả về `UnauthorizedException`.

---

## 7. Metrics & Tasks

| Metric | Giá trị |
|---|---|
| Điểm Story Points | 28 |
| Tổng số Tasks | 14 |
| Bugs Fixed | 2 (Lỗi query param history, lỗi ModuleGuard Group) |

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì. Cập nhật lần cuối: 2026-05-02._
