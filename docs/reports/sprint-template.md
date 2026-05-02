# Sprint XX — [Tên Sprint / Module]

**Ngày bắt đầu:** YYYY-MM-DD  
**Ngày kết thúc:** YYYY-MM-DD  
**Trạng thái:** PLANNED / IN PROGRESS / DONE  
**PR Link:** [#PR_NUMBER](https://github.com/...)

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> [Mô tả mục tiêu của Sprint. Các tính năng/nghiệp vụ nào được giải quyết? Trị giá của tính năng này đối với toàn bộ hệ thống là gì?]

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Các Table mới/Cập nhật:**
  - `ModelName`: Mô tả mục đích của bảng. Các trường dữ liệu quan trọng (ví dụ: khoá ngoại, field JSON).
  - `EnumName`: Các giá trị Enum mới thêm vào.
- **Quan hệ (Relations):**
  - Mô tả sự liên kết giữa các bảng mới và các module cũ (ví dụ: `1-n` từ `User` đến `AuditLog`).

## 3. Luồng xử lý kỹ thuật & Business Logic (Technical Workflow)

Phần này đặc tả chi tiết logic bên trong code, giúp Agent và team bảo trì theo dõi và debug dễ dàng mà không cần đọc từng dòng code.

### 3.1. [Tên luồng chính 1 - ví dụ: Luồng Xác thực (Auth Flow)]
- **Bước 1:** [Mô tả chi tiết, ví dụ: Client gửi POST /auth/login. Server kiểm tra username/password bằng bcrypt.]
- **Bước 2:** [Nếu hợp lệ, sinh cặp JWT Access Token (15m) và Refresh Token (7d). Hash refresh token và lưu vào `User.refresh_token`.]
- **Bước 3:** [Cơ chế revoke: Khi logout hoặc đổi mật khẩu, set `refresh_token` trong DB về `null`.]

### 3.2. [Tên luồng chính 2 - ví dụ: Cơ chế Phân quyền (RBAC)]
- **Cơ chế hoạt động:** 
- **Cách inject:** 

*(Thêm các tiểu mục 3.x tương ứng với các luồng logic quan trọng khác trong Sprint)*

## 4. Đặc tả API Interfaces (Key APIs)

Tóm tắt các API quan trọng được phát triển trong Sprint:

| Endpoint | Method | Params / Payload | Response / Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|---|
| `/api/v1/module/action` | `POST` | `{ "field": "value" }` | Xử lý XYZ, trả về `Entity` | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

Các case lỗi thường gặp và cách hệ thống đang xử lý:

- **Conflict Data:** (ví dụ: Tạo trùng username) -> Hệ thống ném `ConflictException` (409) chặn ở mức Service.
- **Data Not Found:** (ví dụ: Update record bị xoá mềm) -> Trả về `NotFoundException` (404).
- **Transaction Rollback:** (ví dụ: Khi import bulk data lỗi 1 dòng) -> Mô tả cơ chế xử lý transaction trong Prisma.

## 6. Hướng dẫn Bảo trì & Debug (Maintenance Guide)

- **Log files / Audit Trails:** Tính năng này được ghi log tại đâu? (Ví dụ: Bảng `AuditLog`, hoặc file `winston.log`).
- **Các điểm cần lưu ý khi mở rộng (Gotchas):** Nếu team sau muốn thêm tính năng vào module này, cần cẩn thận điều gì? (Ví dụ: Phải update cả schema validator, hoặc nhớ xoá cache redis).

---

## 7. Metrics & Tasks

| Metric | Giá trị |
|---|---|
| Điểm Story Points | XX |
| Tổng số Tasks | XX |
| Lỗi phát sinh (Bugs) | XX |

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì._
