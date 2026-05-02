# Sprint 17 — Deployment Upload UI (Wizard)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Đưa luồng 4-bước Wizard vào quy trình Import thông tin ứng dụng.

## 3. Luồng xử lý kỹ thuật & Business Logic
- Tách biệt logic đọc file CSV ở Client-side (Frontend tự parse, preview) giảm tải cho Backend.
- Gọi `/preview` API để check logic (trùng port, server không tồn tại), sau đó mới gọi `/execute`.

---
## 7. Metrics & Tasks
_Hoàn thiện Import Wizard cho Deployment._
