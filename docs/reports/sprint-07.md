# Sprint 07 — Quản lý Hồ sơ Tài liệu Triển khai

**Ngày bắt đầu:** 2026-04-22  
**Ngày kết thúc:** 2026-04-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý tài liệu hồ sơ (Checklist) cho từng bản ghi triển khai, bao gồm upload file, xem trước và theo dõi tiến độ hoàn thiện hồ sơ.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: DeploymentDocType**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `code` | `String` | Mã loại tài liệu (VD: 'INSTALL_GUIDE') | Unique |
| `required` | `Boolean` | Bắt buộc phải có? | Default: `false` |
| `environments` | `String[]` | Môi trường áp dụng (VD: ['PROD']) | |

#### **Model: DeploymentDoc**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `status` | `Enum` | Trạng thái (`PENDING`, `COMPLETE`, `WAIVED`) | |
| `preview_path` | `String` | Đường dẫn file nháp/preview | |
| `final_path` | `String` | Đường dẫn file chính thức (PDF) | |
| `waived_reason` | `String` | Lý do miễn giảm tài liệu | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (File Management)
- **MIME Validation:** Chỉ cho phép upload các định dạng tài liệu an toàn (PDF, DOCX, XLSX). Riêng file "Final" bắt buộc phải là PDF.
- **Storage Strategy:** File được lưu trữ theo cấu trúc thư mục phân cấp: `uploads/deployments/{deploymentId}/{docTypeId}/filename`.
- **Progress Calculation:** Backend cung cấp API tính toán % hoàn thành hồ sơ dựa trên số lượng tài liệu `required` đã ở trạng thái `COMPLETE` hoặc `WAIVED`.

### 3.2. Tầng Frontend (Document Workflow)
- **DocUploadCard:** Mỗi loại tài liệu được hiển thị dưới dạng một Card với các nút chức năng: Upload, View, Download.
- **Waive Workflow:** Đối với các tài liệu không bắt buộc hoặc có lý do đặc biệt, người dùng có thể chọn "Waive" kèm theo nội dung giải trình. Khi đó tiến độ hồ sơ vẫn được tính là hoàn thành cho đầu mục này.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/deployments/:id/docs/:type/preview` | `POST` | Upload file nháp | `OPERATOR` |
| `/deployments/:id/docs/:type/file` | `GET` | Download/Stream file | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (DocType Schema, File upload service, Progress logic)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
