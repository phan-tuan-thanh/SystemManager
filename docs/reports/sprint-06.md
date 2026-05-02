# Sprint 06 — Quản lý Ứng dụng & Triển khai (Deployments)

**Ngày bắt đầu:** 2026-04-19  
**Ngày kết thúc:** 2026-04-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng danh mục ứng dụng và thiết lập các bản ghi triển khai (AppDeployments) lên Server.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Application**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã ứng dụng | `Unique`, `VarChar(50)` |
| `name` | `String` | Tên hiển thị | `VarChar(255)` |
| `application_type` | `Enum` | Phân loại | `BUSINESS`, `SYSTEM` |

#### **Model / DTO: AppDeployment**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `version` | `String` | Phiên bản | `Required` |
| `status` | `Enum` | Trạng thái | `RUNNING`, `STOPPED`, `DEPRECATED` |
| `cmc_name` | `String` | Tên phiếu yêu cầu (CMC) | `Nullable` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Version History:** Mỗi lần cập nhật Deployment (`version`), hệ thống chụp ảnh state lưu vào `DeploymentHistory`.
- **Pre-fill Docs:** Khi tạo mới `AppDeployment`, hệ thống tự động tạo các bản ghi `DeploymentDoc` trống dựa trên các `DeploymentDocType` đang ở trạng thái `ACTIVE` cho môi trường tương ứng.

### 3.2. Tầng Frontend (Client-side Logic)
- **Deployment Wizard:** Giao diện 3 bước qua component `Steps` để đăng ký triển khai.
- **Application Hook:** Sử dụng `useApplications` và `useDeployments`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/applications` | `GET` | Danh mục ứng dụng | `VIEWER` |
| `/api/v1/deployments` | `POST` | Đăng ký triển khai | `OPERATOR` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useApplications()` | `GET /api/v1/applications` | Hook quản lý danh mục ứng dụng. |
| `useDeployments()` | `POST /api/v1/deployments` | Hook quản lý hồ sơ triển khai. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Duplicate Deployment (Lỗi 409):** Triển khai cùng App, Server và Environment sẽ bị chặn.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi tạo Deployment, hệ thống sẽ tự động quét danh sách hồ sơ bắt buộc (Checklist) để người dùng hoàn thiện sau.

---

## 7. Metrics & Tasks

- Story Points: 22
- Tasks: 9 (App Schema, Deployment logic, Wizard UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
