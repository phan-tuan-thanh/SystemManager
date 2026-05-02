# Sprint 10 — Dashboard Stats & Audit Log View

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Xây dựng giao diện thống kê tổng quan (Dashboard) với các biểu đồ hiển thị sức khoẻ hệ thống. Tích hợp màn hình xem lịch sử Audit Log.

## 2. Kiến trúc & Schema Database
- **Model:** `AuditLog` (action, user_id, entity_type, entity_id, old_value, new_value, ip).

## 3. Luồng xử lý kỹ thuật & Business Logic
- **Audit Log Interceptor:** Tự động bắt các request thay đổi trạng thái (POST, PATCH, DELETE) và log thông tin payload JSON vào bảng AuditLog mà không cần viết code log thủ công ở từng controller.
- Dashboard tự động polling (tải lại mỗi 60s) để lấy dữ liệu thống kê từ API `/dashboard/stats`.

---
## 7. Metrics & Tasks
_Dashboard và Audit Log hoàn tất._
