# Sprint 08 — Quản lý Kết nối Ứng dụng (App Connections)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Quản lý các luồng kết nối logic giữa các ứng dụng với nhau, làm cơ sở dữ liệu để vẽ Topology mạng.

## 2. Kiến trúc & Schema Database
- **Model:** `AppConnection` (source_app_id, target_app_id, port, protocol).
- Chú ý: Kết nối được định nghĩa giữa các *Bản triển khai (Deployments)*, không phải giữa App Catalog chung chung.

## 3. Luồng xử lý kỹ thuật & Business Logic
- Logic kiểm tra sự hợp lệ: Đảm bảo App Nguồn và App Đích đều đang ở trạng thái RUNNING.

---
## 7. Metrics & Tasks
_Xây dựng nền tảng Connection Mapping._
