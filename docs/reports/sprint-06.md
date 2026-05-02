# Sprint 06 — Quản lý Ứng dụng & Triển khai (Deployments)

**Ngày bắt đầu:** 2026-04-19  
**Ngày kết thúc:** 2026-04-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng danh mục ứng dụng, phân loại ứng dụng và thiết lập các bản ghi triển khai (AppDeployments) lên Server.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Application**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã ứng dụng | `Unique`, `VarChar(50)` |
| `name` | `String` | Tên hiển thị | `VarChar(255)` |
| `application_type` | `Enum` | Phân loại ứng dụng | `BUSINESS`, `SYSTEM` |

#### **Model / DTO: AppDeployment**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `version` | `String` | Phiên bản (VD: 'v1.2.0') | `Required` |
| `status` | `Enum` | Trạng thái triển khai | `RUNNING`, `STOPPED` |
| `cmc_name` | `String` | Tên phiếu yêu cầu (CMC) | `Nullable` |

#### **Hằng số & Enums (Constants & Options)**
- `DeploymentStatus`: Trạng thái thực thi (`RUNNING`, `STOPPED`, `DEPRECATED`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Version Tracking & History:** Mỗi khi một Deployment được PATCH (VD: cập nhật từ version 1.0 lên 1.1), Backend chụp lại trạng thái và đẩy vào `DeploymentHistory`.
- **Doc Profile Auto-generation:** Transaction: Khi INSERT thành công bản ghi `AppDeployment`, một Trigger logic sẽ query danh sách các `DeploymentDocType` đang ACTIVE và tạo sẵn (Pre-fill) các bản ghi `DeploymentDoc` tương ứng cho Deployment đó.

### 3.2. Tầng Frontend (Client-side Logic)
- **Deployment Wizard:** Giao diện đăng ký triển khai trải qua 3 bước sử dụng `Steps` component. State được gom nhóm lại trong bộ nhớ React và chỉ submit 1 lần ở bước cuối cùng.
- **Grouped App Catalog:** Sử dụng `Collapse` và `Badge` để nhóm các ứng dụng theo `ApplicationGroup`, đồng thời đếm số lượng instance đang chạy để hiển thị trực quan.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/applications` | `GET` | Danh mục ứng dụng | `VIEWER` |
| `/api/v1/deployments` | `POST` | Đăng ký triển khai ứng dụng lên server | `OPERATOR` |
| `/api/v1/applications/:id/where-running` | `GET` | Xem các server đang chạy ứng dụng này | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Duplicate Deployment (Lỗi 409):** Triển khai cùng 1 Ứng dụng, trên cùng 1 Server, ở cùng 1 Môi trường sẽ bị văng lỗi Conflict (Ràng buộc Unique kết hợp).

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi tạo Deployment, nếu cấu hình Document Types đang trống, hệ thống sẽ bỏ qua bước tạo hồ sơ mà không ném lỗi.

---

## 7. Metrics & Tasks

- Story Points: 22
- Tasks: 9 (App Schema, Deployment logic, Version history UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
