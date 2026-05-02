# Sprint 18 — Multi-Port Deployment & Connection Import

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Hỗ trợ import ứng dụng triển khai nhiều Port cùng lúc và import hàng loạt cấu hình kết nối ứng dụng (Topology Connections).

## 3. Luồng xử lý kỹ thuật & Business Logic
- **Multi-Port:** Khi import, cột Port có thể là chuỗi `80,443`. Backend tự tách mảng và validate chống trùng port trên Server.
- **Connection Import:** Tìm kiếm AppID nguồn và đích dựa trên Tên App và Tên Server, nếu không tìm thấy sẽ báo lỗi ở dòng đó trong bảng Preview.

---
## 7. Metrics & Tasks
_Hoàn thiện logic parse Multi-Port._
