# Sprint 04 — Quản lý Hạ tầng & Linh kiện Phần cứng

**Ngày bắt đầu:** 2026-04-12  
**Ngày kết thúc:** 2026-04-15  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý danh mục máy chủ (Inventory) và linh kiện phần cứng chi tiết gắn kèm.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: Server**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `code` | `String` | Mã định danh duy nhất | Unique, VarChar(50) |
| `hostname` | `String` | Tên máy chủ trên mạng | VarChar(255) |
| `environment` | `Enum` | Môi trường (`PROD`, `UAT`, `DEV`) | Required |
| `infra_type` | `Enum` | Loại hạ tầng (`VM`, `PHYSICAL`, `CLOUD`) | Default: `VM` |
| `site` | `Enum` | Vị trí trung tâm dữ liệu (`DC`, `DR`, `TEST`) | |

#### **Model: HardwareComponent**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `type` | `Enum` | Loại (`CPU`, `RAM`, `HDD`, `SSD`) | Required |
| `model` | `String` | Tên model linh kiện | |
| `specs` | `Json` | Thông số kỹ thuật chi tiết | Lưu dạng Key-Value |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Inventory Logic)
- **Automatic Code Generation:** Nếu không cung cấp mã code khi tạo, hệ thống tự động sinh mã theo pattern `SRV-{ENVIRONMENT}-{UUID}`.
- **Change History Snapshot:** Mỗi khi thông tin Server hoặc linh kiện thay đổi, hệ thống chụp lại toàn bộ object cũ và lưu vào bảng `ChangeHistory` để phục vụ việc truy vết (Audit).

### 3.2. Tầng Frontend (Hardware Management)
- **KV Editor:** Thay vì nhập JSON thô cho trường `specs`, Frontend cung cấp giao diện nhập theo cặp Key-Value động. Người dùng có thể thêm/xoá các hàng thông số một cách linh hoạt.
- **Hardware Presets:** Hệ thống gợi ý các Key phổ biến dựa trên loại linh kiện (VD: CPU sẽ gợi ý `cores`, `clock_speed`; RAM gợi ý `bus_speed`, `capacity`).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/servers` | `GET` | Danh sách server (phân trang + lọc) | `VIEWER` |
| `/hardware` | `POST` | Thêm linh kiện vào server | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (Server CRUD, Hardware specs logic, KV Editor UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
