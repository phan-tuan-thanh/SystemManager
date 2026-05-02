# Sprint 09 — Cấu hình Hệ thống & Client-side Logging

**Ngày bắt đầu:** 2026-04-28  
**Ngày kết thúc:** 2026-04-29  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống cấu hình tham số động cho ứng dụng và cơ chế thu thập log từ phía người dùng (Frontend) về server tập trung.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: SystemConfig**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `key` | `String` | Khoá cấu hình (VD: 'LOG_LEVEL') | Unique |
| `value` | `String` | Giá trị cấu hình | |

#### **Model: ClientLog**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `level` | `String` | Mức độ (`INFO`, `ERROR`, `WARN`) | |
| `message` | `String` | Nội dung log | |
| `meta` | `Json` | Dữ liệu bổ sung (Browser, URL, UserAgent) | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (System Hot-reload)
- **Dynamic Config Service:** Cung cấp cơ chế cache cấu hình. Khi Admin thay đổi giá trị trong bảng `SystemConfig`, các service liên quan sẽ tự động nhận giá trị mới mà không cần restart app.
- **Log Aggregator:** Endpoint nhận log từ Frontend thực hiện bóc tách thông tin Session người dùng và ghi vào Database kèm theo thông tin địa chỉ IP của client.

### 3.2. Tầng Frontend (Log Collector)
- **Global Error Boundary:** Tự động bắt mọi lỗi runtime trên trình duyệt và gửi về Backend thông qua API `ClientLog`.
- **Log Console UI:** Giao diện cho phép Admin xem danh sách các log lỗi từ phía client theo thời gian thực để hỗ trợ xử lý sự cố nhanh chóng.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/system-configs/:key` | `GET` | Lấy giá trị cấu hình | `VIEWER` |
| `/client-logs` | `POST` | Frontend gửi log lỗi về server | `@Public()` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Config Schema, Logging Service, Log Viewer UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
