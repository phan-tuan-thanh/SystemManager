# Sprint 07 — Quản lý Hồ sơ Tài liệu Triển khai

**Ngày bắt đầu:** 2026-04-22  
**Ngày kết thúc:** 2026-04-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý tài liệu hồ sơ (Checklist) cho từng bản ghi triển khai.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: DeploymentDoc**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `status` | `Enum` | Trạng thái tài liệu | `PENDING`, `DRAFT`, `COMPLETE`, `WAIVED` |
| `preview_path` | `String` | Đường dẫn file nháp | `VarChar(500)` |
| `final_path` | `String` | Đường dẫn file chốt | `VarChar(500)` |

#### **Model / DTO: DeploymentDocType**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã loại tài liệu | `Unique` |
| `required` | `Boolean` | Bắt buộc? | Default: `false` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **MIME Validation:** Chỉ chấp nhận các định dạng `PDF`, `DOCX`, `XLSX`.
- **Progress Logic:** Tự động tính toán % hoàn thành dựa trên số lượng file `COMPLETE` hoặc `WAIVED` trên tổng số file `required`.

### 3.2. Tầng Frontend (Client-side Logic)
- **DocUpload Hook:** Quản lý upload và download thông qua hook `useDeployments`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/deployments/:id/docs/:type/preview` | `POST` | Upload bản thảo | `OPERATOR` |
| `/api/v1/deployments/:id/docs/:type/final` | `POST` | Upload bản chốt | `OPERATOR` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useDeployments()` | `POST /api/v1/deployments/.../docs` | Hook tích hợp quản lý hồ sơ tài liệu. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Invalid File Type (Lỗi 415):** Định dạng file không được phép.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Các file vật lý được lưu trữ phân cấp theo cấu trúc `uploads/deployments/{id}/`.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (DocType Schema, File upload, Progress calculation)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
