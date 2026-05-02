# Sprint 09 — Cấu hình Hệ thống & Client-side Logging

**Ngày bắt đầu:** 2026-04-28  
**Ngày kết thúc:** 2026-04-29  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý các tham số cấu hình hệ thống (Hot-reload Configs) và triển khai cơ chế thu thập log từ người dùng (Frontend) đổ về trung tâm (Backend).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: SystemConfig**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `key` | `String` | Khoá nhận diện | `Unique`, `Required` |
| `value` | `String` | Giá trị (Lưu dạng chuỗi) | `Required` |

#### **Model / DTO: ClientLog**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `level` | `String` | Mức độ cảnh báo | `INFO`, `ERROR`, `WARN` |
| `message` | `String` | Chuỗi log thô | `Text` |
| `meta` | `Json` | Object thông tin thêm | Browser info, URL, User-Agent |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Dynamic Config Cache:** Cung cấp Service cache lại các giá trị cấu hình vào RAM. Khi có lệnh update cấu hình từ Admin, hệ thống phát event để xoá cache. Các module khác sử dụng giá trị này sẽ thay đổi hành vi ngay lập tức (Hot-reload) mà không cần restart server.
- **Log Aggregator (Winston):** Đăng ký `LoggerModule` sử dụng Winston. Log từ Frontend gửi về qua API sẽ được Winston phân phối (ghi ra màn hình console, hoặc đẩy ra file logs tuỳ cấu hình đang chạy).

### 3.2. Tầng Frontend (Client-side Logic)
- **Global Error Boundary (React):** Bao bọc toàn bộ App. Bắt lại các lỗi crash render UI (JavaScript Error), ngăn trang web bị trắng bóc. Sau đó tự động gọi API POST `/client-logs` kèm call stack về Backend.
- **Axios Error Interceptor:** Bắt toàn bộ lỗi Network (VD: 500 Internal Server Error) và gửi log về hệ thống giám sát.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/system-configs` | `GET` | Truy vấn tham số cấu hình | `VIEWER` |
| `/api/v1/client-logs` | `POST` | Endpoint nhận log từ Client | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Log Spam Protection:** API `client-logs` sử dụng Rate Limit (Giới hạn truy cập) để ngăn bị DDOS do lỗi vòng lặp bên Frontend.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi đổi giá trị `LOG_LEVEL` qua UI, cần đảm bảo Winston đang lắng nghe sự thay đổi của biến này để cập nhật transport tương ứng.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Config Schema, Logging Service, Log Viewer UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
