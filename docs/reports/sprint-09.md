# Sprint 09 — Cấu hình Hệ thống & Client-side Logging

**Ngày bắt đầu:** 2026-04-28  
**Ngày kết thúc:** 2026-04-29  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý các tham số cấu hình hệ thống (Hot-reload Configs) và triển khai cơ chế thu thập log từ người dùng (Frontend).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: SystemConfig**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `key` | `String` | Khoá nhận diện | `Unique`, `Required` |
| `value` | `String` | Giá trị (Chuỗi) | `Required` |

#### **Model / DTO: ClientLog**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `level` | `String` | Mức độ | `INFO`, `ERROR`, `WARN` |
| `message` | `String` | Nội dung log | `Text` |
| `meta` | `Json` | Thông tin thêm | `Nullable` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Config Hot-reload:** Backend sử dụng cache trong RAM để lưu cấu hình. Khi Admin update, hệ thống tự động làm mới cache mà không cần restart.
- **Log Aggregation:** Tích hợp với Winston logger để ghi lại log từ Frontend.

### 3.2. Tầng Frontend (Client-side Logic)
- **Global Error Boundary:** Bắt lỗi JavaScript Crash và tự động gọi API POST `/api/v1/client-logs` để ghi nhận lỗi.
- **Log Hook:** Sử dụng hook `useLogConfig`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/admin/system-config` | `GET` | Lấy cấu hình hệ thống | `ADMIN` |
| `/api/v1/client-logs` | `POST` | Gửi log từ Client | `@Public()` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useLogConfig()` | `POST /api/v1/client-logs` | Hook gửi log về server trung tâm. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Log Spam:** API `client-logs` có giới hạn Rate Limit để chống bị tấn công spam log.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi thay đổi tham số hệ thống quan trọng (VD: Secret Key), các phiên làm việc hiện tại có thể bị gián đoạn.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Config Schema, Logging logic, Admin UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
