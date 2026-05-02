# Sprint 23 — Cấu hình Loại tài liệu & Tổng kết

**Ngày bắt đầu:** 2026-05-24  
**Ngày kết thúc:** 2026-05-25  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Hoàn thiện cấu hình danh mục Loại tài liệu (Doc Types) và tối ưu hóa quy trình tính toán tiến độ triển khai.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **DeploymentDocType Fields**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `required` | `Boolean` | Bắt buộc cho mọi Deployment? | |
| `environments` | `String[]` | Chỉ áp dụng cho môi trường này | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Compliance Logic)
- **Dynamic Checklist Generation:** Mỗi khi một Deployment mới được khởi tạo, hệ thống quét qua toàn bộ `DocTypes`. Chỉ những loại tài liệu có `environment` khớp với Deployment mới được tạo bản ghi Checklist tương ứng.
- **Mandatory Check:** Hệ thống chặn không cho phép đổi trạng thái Deployment sang `DONE` nếu vẫn còn tài liệu `required` chưa hoàn thành (`COMPLETE` hoặc `WAIVED`).

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 3 (DocType config, Compliance logic, Project wrap-up)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
