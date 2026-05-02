# Sprint 07 — Quản lý Hồ sơ Tài liệu Triển khai

**Ngày bắt đầu:** 2026-04-22  
**Ngày kết thúc:** 2026-04-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý tài liệu hồ sơ (Checklist) cho từng bản ghi triển khai, bao gồm quy trình upload file 2 bước (Preview/Final), miễn giảm tài liệu và tính toán tiến độ hoàn thiện hồ sơ.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: DeploymentDocType**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã loại tài liệu | `Unique`, `VarChar(50)` |
| `required` | `Boolean` | Tính bắt buộc | Default: `false` |
| `environments` | `String[]` | Áp dụng cho các môi trường nào | (VD: ['PROD', 'UAT']) |

#### **Model / DTO: DeploymentDoc**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `status` | `Enum` | Trạng thái của file tài liệu | `PENDING`, `DRAFT`, `COMPLETE`, `WAIVED` |
| `preview_path` | `String` | Đường dẫn lưu file nháp/preview | `VarChar(500)` |
| `final_path` | `String` | Đường dẫn lưu file chốt (PDF) | `VarChar(500)` |
| `waived_reason` | `String` | Lý do miễn giảm | `Text` |

#### **Hằng số & Enums (Constants & Options)**
- `DocStatus`: Trạng thái xử lý vòng đời tài liệu.
- Tùy chọn Upload: Định dạng `PDF`, `DOCX`, `XLSX`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **MIME Type Validation & Multer:** Sử dụng Multer (MemoryStorage) để nhận file. Tích hợp bộ chặn file dựa trên MIME type (application/pdf, vnd.openxmlformats...).
- **File System Storage:** Backend phân cấp lưu trữ file vật lý theo đường dẫn: `uploads/deployments/{deployment_id}/{doc_type_id}/[preview|final]`.
- **Progress Calculation:** Cung cấp API GET `/deployments/:id` tính toán thời gian thực % hoàn thành hồ sơ (Số tài liệu `COMPLETE` hoặc `WAIVED` / Tổng số tài liệu `required`).

### 3.2. Tầng Frontend (Client-side Logic)
- **DocUploadCard Component:** Mỗi tài liệu được đóng gói thành một Card chứa: Tên tài liệu, Status Badge, Nút Upload và Drawer hiển thị lịch sử upload.
- **Waive Workflow (Miễn giảm):** Khi người dùng muốn miễn giảm tài liệu, một Modal xuất hiện yêu cầu nhập lý do (`waived_reason`). Khi xác nhận, Card chuyển sang màu xám và tiến độ tổng vẫn được cộng.
- **File Download/Streaming:** Tích hợp logic download blob file từ Backend trả về, tự động suy luận (infer) tên file và phần mở rộng để tạo link download (href).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/deployments/:id/docs/:type/preview` | `POST` | Upload bản thảo | `OPERATOR` |
| `/api/v1/deployments/:id/docs/:type/final` | `POST` | Upload bản chốt (Chỉ nhận PDF) | `OPERATOR` |
| `/api/v1/deployments/:id/docs/:type/waive` | `PATCH` | Yêu cầu miễn giảm tài liệu | `OPERATOR` |
| `/api/v1/deployments/:id/docs/:type/file` | `GET` | Streaming file content | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Invalid File Type (Lỗi 415):** File tải lên không đúng định dạng cho phép -> Backend ném `UnsupportedMediaTypeException`.
- **File Too Large (Lỗi 413):** File vượt quá 20MB -> Bị từ chối bởi PayloadTooLarge chặn ở lớp Interceptor.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi xoá một Deployment (Soft Delete), hệ thống KHÔNG xoá file vật lý để đảm bảo dấu vết pháp lý. Nếu cần dọn dẹp dung lượng server, cần viết script Cron dọn rác thủ công.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (DocType Schema, File upload service, Progress logic)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
