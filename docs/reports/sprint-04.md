# Sprint 04 — Quản lý Linh kiện (Hardware Inventory)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Quản lý kho linh kiện (CPU, RAM, Ổ cứng) và liên kết chúng vào các Server vật lý/ảo.

## 2. Kiến trúc & Schema Database
- **Model:** `HardwareItem` (loại, dung lượng, nhà sản xuất).
- **Relations:** 1 Server có thể chứa nhiều HardwareItems (1-n).

## 3. Luồng xử lý kỹ thuật & Business Logic
- Tính tổng dung lượng tự động: Khi gán nhiều thanh RAM vào 1 Server, API lấy chi tiết Server sẽ tự động `SUM()` tổng dung lượng RAM để trả về giao diện.
- Form nhập liệu Hardware sử dụng mảng JSON để nhập nhiều tham số cấu hình linh hoạt tuỳ theo loại linh kiện.

---
## 7. Metrics & Tasks
_Hoàn thiện CRUD Hardware._
