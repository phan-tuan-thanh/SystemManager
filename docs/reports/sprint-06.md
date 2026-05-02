# Sprint 06 — Quản lý Ứng dụng & Triển khai (App Deployments)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Định nghĩa danh mục Ứng dụng (Catalog) và quản lý trạng thái các bản triển khai thực tế trên Server.

## 2. Kiến trúc & Schema Database
- **Model:** `Application` (App Catalog).
- **Model:** `AppDeployment` (Bảng mapping n-n giữa App và Server), có trường `status` (RUNNING, STOPPED, MAINTENANCE) và `port`.

## 3. Luồng xử lý kỹ thuật & Business Logic
- **Cơ chế Triển khai:** Một App có thể deploy lên nhiều Server (Clustering) hoặc nhiều App có thể nằm trên cùng 1 Server.
- Cảnh báo xung đột Port: Khi tạo mới `AppDeployment`, hệ thống kiểm tra nếu Server đó đã có App khác listen cùng Port -> báo lỗi Conflict.

---
## 7. Metrics & Tasks
_Hoàn thiện App Catalog và Deployment._
