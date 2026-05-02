# Sprint 04 — Quản lý Hạ tầng & Linh kiện Phần cứng

**Ngày bắt đầu:** 2026-04-12  
**Ngày kết thúc:** 2026-04-15  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý danh mục máy chủ (Inventory) và linh kiện phần cứng chi tiết gắn kèm.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Server**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã định danh duy nhất | `Unique`, `VarChar(50)` |
| `hostname` | `String` | Tên máy chủ trên mạng | `VarChar(255)` |
| `environment` | `Enum` | Môi trường triển khai | `PROD`, `UAT`, `DEV` |
| `infra_type` | `Enum` | Loại hạ tầng | `VIRTUAL_MACHINE`, `PHYSICAL_SERVER`, `CONTAINER`, `CLOUD_INSTANCE` |
| `site` | `Enum` | Vị trí trung tâm dữ liệu | `DC`, `DR`, `TEST` |

#### **Model / DTO: HardwareComponent**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `type` | `Enum` | Loại linh kiện | `CPU`, `RAM`, `HDD`, `SSD`, `NETWORK_CARD` |
| `model` | `String` | Tên model linh kiện | `VarChar(255)` |
| `specs` | `Json` | Thông số kỹ thuật chi tiết | Lưu dạng Key-Value (JSON) |

#### **Hằng số & Enums (Constants & Options)**
- `ServerPurpose`: [`APP_SERVER`, `DB_SERVER`, `PROXY`, `LOAD_BALANCER`, `CACHE`, `MESSAGE_QUEUE`, `OTHER`].

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Automatic Code Gen:** Nếu không cung cấp `code`, hệ thống tự sinh mã theo pattern `SRV-{ENVIRONMENT}-{UUID}`.
- **Change History Snapshot:** Mỗi khi có thao tác PATCH/PUT lên Server hoặc linh kiện, `ChangeHistoryService` chụp lại toàn bộ state và lưu vào bảng `change_histories`.

### 3.2. Tầng Frontend (Client-side Logic)
- **KV Editor:** Sử dụng `Form.List` của AntD để tạo giao diện nhập liệu Key-Value động cho trường `specs`.
- **Hardware Hook:** Sử dụng `useHardware` để quản lý các thao tác thêm/xoá linh kiện.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/servers` | `GET` | Danh sách server | `VIEWER` |
| `/api/v1/hardware` | `POST` | Thêm linh kiện vào server | `OPERATOR` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useServers(params)` | `GET /api/v1/servers` | Hook fetch danh sách máy chủ. |
| `useHardware()` | `POST /api/v1/hardware` | Hook quản lý linh kiện phần cứng. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Duplicate Code (Lỗi 409):** Trả về khi tạo Server với mã `code` đã tồn tại.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi xoá linh kiện, thực hiện Soft Delete (cập nhật `deleted_at`).

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (Server CRUD, Hardware specs, KV Editor)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
