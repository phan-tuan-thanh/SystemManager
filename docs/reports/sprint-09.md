# Sprint 09 — Cấu hình Hệ thống & Hot-reload Logging

**Ngày bắt đầu:** 2026-04-23  
**Ngày kết thúc:** 2026-04-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cung cấp khả năng cấu hình hệ thống linh hoạt, đặc biệt là cơ chế **Hot-reload Logging** cho phép thay đổi mức độ log (Log Level) ngay lập tức mà không cần khởi động lại Server. Ngoài ra, tích hợp khả năng thu thập log từ Frontend (Client Logs).

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `SystemConfig`:** Lưu trữ cặp Key-Value cho các biến hệ thống (VD: `LOG_LEVEL`, `LOG_ENABLED`).
- **Model `ClientLog`:** Lưu trữ nhật ký lỗi/thông tin từ trình duyệt của người dùng (UserAgent, URL, Stack trace).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Hot-reload Logging
- **Logic:** Khi Admin cập nhật `LOG_LEVEL` qua API:
  - Hệ thống sử dụng `$transaction` để `upsert` (cập nhật hoặc tạo mới) nhiều khoá cấu hình cùng lúc.
  - Sau khi lưu DB thành công, gọi `this.logger.reloadConfig()`.
  - `AppLoggerService` sẽ đọc lại giá trị mới từ DB và áp dụng trực tiếp cho `Winston logger` instance đang chạy.
- **Lợi ích:** Có thể bật chế độ `DEBUG` để truy vết lỗi trên PROD trong 5 phút rồi tắt đi ngay mà không gây downtime.

### 3.2. Thu thập Client Logs
- **Luồng xử lý:** Frontend bắt các lỗi runtime (`window.onerror`) và gửi hàng loạt (Bulk insert) về backend qua API `/system-config/client-logs`.
- Dữ liệu lưu trữ bao gồm cả `userAgent` và `sessionId` để hỗ trợ tái hiện lỗi (reproduce).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/system-config/log` | `PATCH` | `{ level: 'debug' }` | Cập nhật & Reload Logger | `ADMIN` |
| `/system-config/client-logs`| `POST` | `CreateClientLogDto[]` | Thu thập log từ Frontend | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Transaction Safe:** Nếu việc reload logger lỗi, transaction DB sẽ không bị rollback nhưng lỗi sẽ được ghi nhận vào log cũ để Admin biết cấu hình mới chưa được áp dụng hoàn toàn.

## 6. Hướng dẫn Bảo trì & Debug

- **Log Level:** Các mức độ hỗ trợ gồm: `error`, `warn`, `info`, `debug`, `verbose`.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (SystemConfig Schema, Hot-reload logic, ClientLog collection, Bulk insert)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
