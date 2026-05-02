# Sprint 16 — App Group Restructure & Unified Catalog

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Tái cấu trúc nhóm ứng dụng. Gộp chung Business App và System App vào một Catalog duy nhất.

## 2. Kiến trúc & Schema Database
- **Cập nhật Model:** `ApplicationGroup` thêm trường `group_type` (BUSINESS / INFRA).

## 3. Luồng xử lý kỹ thuật & Business Logic
- Phân luồng logic: Nếu là INFRA group, các App bên trong có thêm trường metadata như `vendor`, `eol_date`.
- Đảm bảo Backward Compatibility (tương thích ngược) với dữ liệu cũ khi migration.

---
## 7. Metrics & Tasks
_Sửa lại schema App Group._
