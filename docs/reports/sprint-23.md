# Sprint 23 — Cấu hình Loại tài liệu & Tổng kết

**Ngày bắt đầu:** 2026-05-24  
**Ngày kết thúc:** 2026-05-25  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Khóa chặt quy trình cung cấp hồ sơ. Hệ thống sẽ tự động ép buộc tính tuân thủ thông qua cờ "required" dựa theo loại tài liệu và không cho phép hoàn tất dự án nếu thiếu tài liệu.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: DeploymentDocType (Tính tuân thủ)**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `required` | `Boolean` | Tính bắt buộc của hồ sơ | Quyết định logic chặn bước |
| `environments` | `String[]` | Áp dụng trên môi trường nào | VD: Chỉ PROD mới cần Guide |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Compliance Enforcement Logic:** Trong API Patch đổi `status` của AppDeployment sang `DONE`, Backend sẽ query tất cả các `DeploymentDoc` đang gắn với nó. Nếu phát hiện một `Doc` thuộc loại có cờ `required=true` mà trạng thái hiện tại khác `COMPLETE` hoặc `WAIVED`, Backend sẽ ném lỗi 422 Unprocessable Entity chặn lệnh đổi trạng thái.
- **Dynamic Pre-fill:** Tự động gen bản ghi tài liệu mới cho tất cả các deployment hiện tại nếu Admin thêm một `DocType` mới.

### 3.2. Tầng Frontend (Client-side Logic)
- **Action Blocking:** Nút "Hoàn thành triển khai" trên giao diện chi tiết Deployment tự động bị Disable (Xám lại) và thêm tooltip: "Vui lòng hoàn thành 2/3 tài liệu bắt buộc trước khi chốt" dựa vào hàm tính toán do Frontend tự chạy offline.

## 4. Đặc tả API Interfaces

*(Cập nhật lại API PATCH `/api/v1/deployments/:id/status`)*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Compliance Violation (Lỗi 422):** Thông điệp trả về chỉ đích danh các `code` tài liệu còn đang thiếu.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi thay đổi cờ `required` từ `false` sang `true`, các Deployment cũ đã `DONE` sẽ không bị ảnh hưởng (Quy tắc hồi tố).

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 3 (DocType config, Compliance logic, Project wrap-up)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
