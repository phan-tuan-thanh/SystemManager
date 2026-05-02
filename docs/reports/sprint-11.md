# Sprint 11 — Tích hợp Microsoft 365 (SSO) & ChangeSet

**Ngày bắt đầu:** 2026-05-03  
**Ngày kết thúc:** 2026-05-05  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai đăng nhập một chạm qua Microsoft Azure AD và cơ chế gom nhóm thay đổi (ChangeSet) trước khi apply.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ChangeSet**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `title` | `String` | Tiêu đề thay đổi | `VarChar(255)` |
| `status` | `String` | Trạng thái | `DRAFT`, `PREVIEWING`, `APPLIED` |

#### **Model / DTO: ChangeItem**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `action` | `String` | Hành động | `CREATE`, `UPDATE`, `DELETE` |
| `new_value` | `Json` | Nội dung thay đổi | `Required` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **OIDC Flow:** Sử dụng `passport-azure-ad` để xử lý luồng xác thực OpenID Connect.
- **Account Linking:** Nếu Email từ Microsoft trùng với User nội bộ, hệ thống tự động liên kết bằng cách cập nhật `microsoft_id`.

### 3.2. Tầng Frontend (Client-side Logic)
- **SSO Redirect:** Nút "Login with Microsoft" gọi API Backend để lấy URL redirect của Azure.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/auth/ms365` | `GET` | Khởi chạy luồng OIDC | `@Public()` |
| `/api/v1/auth/ms365/callback` | `GET` | Xử lý callback từ Azure | `@Public()` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `handleMs365Login()` | `GET /api/v1/auth/ms365` | Hàm khởi phát luồng redirect sang trang Microsoft. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **SSO Disabled (Lỗi 403):** Nếu User bị khoá tài khoản local, dù Microsoft trả về thành công cũng không được đăng nhập.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Cần cấu hình chính xác `Redirect URI` trên Azure AD Portal trùng với API callback của dự án.

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (Azure AD config, OIDC strategy, ChangeSet logic)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
