# Sprint 06 — Quản lý Ứng dụng & Triển khai (Deployments)

**Ngày bắt đầu:** 2026-04-19  
**Ngày kết thúc:** 2026-04-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng danh mục ứng dụng nghiệp vụ và quản lý các bản ghi triển khai thực tế trên hạ tầng.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: Application**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `code` | `String` | Mã ứng dụng (VD: 'CORE_BANKING') | Unique |
| `name` | `String` | Tên hiển thị | |
| `application_type` | `Enum` | Loại (`BUSINESS` / `SYSTEM`) | |

#### **Model: AppDeployment**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `version` | `String` | Phiên bản đang chạy (VD: '1.2.0-stable') | Required |
| `status` | `Enum` | Trạng thái (`RUNNING`, `STOPPED`) | |
| `cmc_name` | `String` | Tên ticket/phiếu yêu cầu triển khai | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Deployment Logic)
- **Version Tracking:** Mỗi lần cập nhật bản ghi Deployment, hệ thống tạo bản ghi mới trong `DeploymentHistory` để lưu vết lịch sử nâng cấp phiên bản ứng dụng trên server đó.
- **Auto-populate Doc Profile:** Khi một Deployment mới được tạo, hệ thống tự động sinh ra danh sách các đầu mục tài liệu (DeploymentDocs) dựa trên các loại tài liệu (`DocTypes`) đang ở trạng thái `ACTIVE` trong cấu hình hệ thống.

### 3.2. Tầng Frontend (App Catalog)
- **Grouped View:** Danh sách ứng dụng được phân nhóm theo `ApplicationGroup`. Người dùng có thể xem nhanh số lượng instance đang chạy của từng ứng dụng qua các Badge số lượng.
- **Deployment Wizard:** Giao diện 3 bước để đăng ký triển khai mới: Chọn Ứng dụng → Chọn Server đích → Nhập thông tin phiên bản & CMC.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/deployments` | `POST` | Đăng ký triển khai ứng dụng | `OPERATOR` |
| `/applications/:id/where-running` | `GET` | Xem các server đang chạy app này | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 22
- Tasks: 9 (App Schema, Deployment logic, Version history UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
