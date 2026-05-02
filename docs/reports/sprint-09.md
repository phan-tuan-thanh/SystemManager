# Sprint 09 — Cấu hình Hệ thống & Hot-reload Logging

**Ngày bắt đầu:** 2026-04-23  
**Ngày kết thúc:** 2026-04-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cung cấp khả năng cấu hình hệ thống linh hoạt, đặc biệt là cơ chế **Hot-reload Logging** và thu thập log từ Frontend (Client Logs).

## 2. Kiến trúc & Schema Database (Architecture)

- **Model `SystemConfig`:** Lưu trữ Key-Value (VD: `LOG_LEVEL`).
- **Model `ClientLog`:** Lưu trữ nhật ký lỗi từ trình duyệt.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Configuration & Logging Logic)
- **Hot-reload Mechanism:** Khi Admin cập nhật cấu hình qua API, Backend thực hiện `upsert` vào DB và gọi ngay `logger.reloadConfig()`. Winston logger sẽ áp dụng Log Level mới ngay lập tức mà không cần khởi động lại Server.
- **Bulk Log Insertion:** API `client-logs` hỗ trợ nhận mảng dữ liệu (Array) để thực hiện bulk insert vào DB, giúp giảm tải IO khi Frontend gửi nhiều log cùng lúc.

### 3.2. Tầng Frontend (Admin Config UI)
- **Giao diện Cấu hình (`SystemConfigPage`):** Cung cấp các Switch và Select để Admin điều chỉnh tham số hệ thống.
- **Cơ chế Thu thập Log (Client Logger):** Tích hợp một logger wrapper trên Frontend. Khi có lỗi runtime hoặc lỗi API (`4xx/5xx`), logger tự động thu thập `userAgent`, `URL`, `Stack trace` và gửi về Backend theo định kỳ (thông qua cơ chế debounce hoặc batch).
- **Session ID:** Mỗi log gửi về được gắn `sessionId` của phiên làm việc hiện tại để hỗ trợ việc tái hiện lỗi (Reproduce).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/system-config/log` | `PATCH` | Cập nhật & Reload Logger | `ADMIN` |
| `/system-config/client-logs`| `POST` | Thu thập log từ Frontend | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Transaction Safe:** Sử dụng `$transaction` khi cập nhật nhiều khoá cấu hình cùng lúc để đảm bảo tính toàn vẹn.

## 6. Hướng dẫn Bảo trì & Debug

- **Log Level:** Các mức độ hỗ trợ: `error`, `warn`, `info`, `debug`, `verbose`.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (SystemConfig Schema, Hot-reload logic, ClientLog collection UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
