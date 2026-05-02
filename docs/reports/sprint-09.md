# Sprint 09 — Cấu hình Hệ thống & Bulk Import

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Quản lý cấu hình chung (System Settings) và hỗ trợ Import dữ liệu hàng loạt từ file Excel.

## 3. Luồng xử lý kỹ thuật & Business Logic
- **SystemSettings Service:** Cache các biến môi trường cấu hình động (như SMTP, Theme default).
- **Bulk Import (Bước 1):** Xử lý parse CSV đơn giản ở backend, lặp qua từng dòng và tạo bản ghi. Hỗ trợ Rollback nếu xảy ra lỗi giữa chừng bằng Database Transactions.

---
## 7. Metrics & Tasks
_Hoàn thiện Import/Settings._
