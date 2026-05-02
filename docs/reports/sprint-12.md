# Sprint 12 — Global Search & Filtering

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Tìm kiếm xuyên suốt hệ thống (Global Search) từ header. Tìm nhanh Server, App, Document chỉ bằng 1 thanh search.

## 3. Luồng xử lý kỹ thuật & Business Logic
- **Global Search API:** Gọi các Service liên quan (ServerService, AppService) để thực hiện query full-text search (`ilike`) và gom nhóm kết quả trả về.
- Frontend sử dụng `TanStack Query` để debounce typing và cache kết quả tìm kiếm.

---
## 7. Metrics & Tasks
_Tích hợp Search UI và Backend API._
