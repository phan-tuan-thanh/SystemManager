# Sprint 08 — Phân tích Phụ thuộc & Kết nối Ứng dụng

**Ngày bắt đầu:** 2026-04-21  
**Ngày kết thúc:** 2026-04-22  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng cơ sở dữ liệu về mối quan hệ giữa các ứng dụng (Application Dependencies). Đây là dữ liệu đầu vào cốt lõi để vẽ sơ đồ Topology và phân tích ảnh hưởng (Impact Analysis) khi có sự cố.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `AppConnection`:**
  - `source_app_id`: Ứng dụng nguồn (client).
  - `target_app_id`: Ứng dụng đích (server/service).
  - `target_port_id`: Cổng kết nối cụ thể của ứng dụng đích.
  - `connection_type`: Enum (`REQUEST`, `SYNC`, `MESSAGE_QUEUE`, v.v.).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Phân tích Phụ thuộc (Upstream & Downstream)
- **Logic (`getDependencies`):**
  - **Downstream (Phụ thuộc vào):** Các kết nối mà ứng dụng hiện tại đóng vai trò là Nguồn (`source`).
  - **Upstream (Ứng dụng phụ thuộc):** Các kết nối mà ứng dụng hiện tại đóng vai trò là Đích (`target`).
- Hệ thống hỗ trợ lọc theo môi trường (Environment) để xem sơ đồ phụ thuộc riêng rẽ giữa DEV, UAT và PROD.

### 3.2. Ràng buộc Logic Kết nối
- **Chống vòng lặp tự thân (Self-loop):** Chặn việc một ứng dụng tự kết nối tới chính nó tại tầng Service validation.
- **Ràng buộc Port:** Khi gán `target_port_id`, hệ thống kiểm tra port đó có thực sự thuộc về ứng dụng đích (`target_app_id`) hay không.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/connections` | `POST` | Tạo kết nối mới (validate port/self-loop) | `OPERATOR` |
| `/connections/app/:id/deps`| `GET` | Lấy danh sách Upstream/Downstream | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Foreign Key Violation:** Nếu xoá một Ứng dụng đang có kết nối hiện hữu, hệ thống trả về lỗi ràng buộc.
- **Port Mismatch:** Trả về `400 BadRequest` nếu port trỏ tới không thuộc ứng dụng đích đã chọn.

## 6. Hướng dẫn Bảo trì & Debug

- **Topology Input:** Dữ liệu từ bảng này là nguồn tin cậy duy nhất (Single source of truth) cho module Topology. Nếu sơ đồ Topology vẽ sai, hãy kiểm tra dữ liệu thô trong bảng `AppConnection`.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Connection Schema, Dependency logic, Validation rules, Upstream/Downstream API)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
