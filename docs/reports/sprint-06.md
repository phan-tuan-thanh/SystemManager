# Sprint 06 — Unified Application Catalog

**Ngày bắt đầu:** 2026-04-17  
**Ngày kết thúc:** 2026-04-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng kho ứng dụng tập trung (Application Catalog). Thiết lập các quy tắc phân loại chặt chẽ giữa Ứng dụng nghiệp vụ (Business App) và Phần mềm hạ tầng (Infrastructure Software), đảm bảo tính nhất quán trong quản lý và triển khai.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `Application`:**
  - `application_type`: Enum (`BUSINESS`, `SYSTEM`).
  - `sw_type`: Phân loại phần mềm hệ thống (OS, DB, WEB_SERVER, v.v.).
- **Model `AppGroup`:** Phân vùng logic cho các ứng dụng (`group_type`: `BUSINESS` hoặc `INFRASTRUCTURE`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Quy tắc Phân loại (Type Validation)
- **Ràng buộc:** 
  - Một ứng dụng loại `BUSINESS` **bắt buộc** phải thuộc về một AppGroup loại `BUSINESS`.
  - Một ứng dụng loại `SYSTEM` (Phần mềm hạ tầng) **bắt buộc** phải thuộc về AppGroup loại `INFRASTRUCTURE`.
- **Thực thi:** Logic này được kiểm tra tại `ApplicationService.create` và `update`. Nếu vi phạm, hệ thống trả về `400 BadRequest`.

### 3.2. Tra cứu Trạng thái Triển khai (Deployment Status)
- Hàm `whereRunning` cung cấp cái nhìn tổng quát: Một ứng dụng đang chạy ở những môi trường nào, trên các Server nào, kèm theo thông tin phiên bản (Version) và trạng thái của Server đó. Dữ liệu được nhóm (Group by) theo Environment.

### 3.3. Theo dõi Vòng đời (EOL Tracking)
- Đối với các phần mềm hệ thống (`SYSTEM`), trường `eol_date` (End-of-life) được dùng để quản lý thời hạn hỗ trợ của nhà cung cấp (`vendor`).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/applications` | `POST` | `CreateApplicationDto` | Tạo App (kèm Type Validation) | `OPERATOR` |
| `/applications/:id/running`| `GET` | N/A | Xem danh sách triển khai thực tế | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Type Mismatch:** Thông báo lỗi cụ thể khi gán nhầm App vào Group không cùng loại.
- **Code Unique:** Chặn tạo trùng `code` (Mã ứng dụng) trên toàn hệ thống (check `deleted_at: null`).

## 6. Hướng dẫn Bảo trì & Debug

- **Include Count:** API danh sách mặc định trả về `_count` cho `app_deployments` và `ports` để hiển thị nhanh thống kê trên UI mà không cần fetch chi tiết.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 8 (App/Group Schema, Type Validation Logic, Deployment Status API, EOL management)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
