# Sprint 03 — Quản lý Cấu hình Module (Module Guard)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Xây dựng hệ thống quản trị tính năng động. Admin có thể bật/tắt (Enable/Disable) các module trong hệ thống mà không cần deploy lại code.

## 2. Kiến trúc & Schema Database
- **Model:** `ModuleConfig` (module_key, is_active, is_core).
- **Core Modules:** Các module mang cờ `is_core = true` không thể bị tắt.

## 3. Luồng xử lý kỹ thuật & Business Logic
- **ModuleGuard:** Một Interceptor/Guard toàn cục được gắn trên các Endpoint. Trước khi request vào Controller, Guard sẽ kiểm tra trạng thái `is_active` của `module_key` tương ứng.
- Nếu tắt, Guard ném `403 Forbidden`.
- Cache cấu hình trên Redis (tuỳ chọn mở rộng) để tránh query DB mỗi request.

---
## 7. Metrics & Tasks
_Hoàn thiện ModuleGuard và giao diện Module Settings._
