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
| `environment` | `Enum` | Môi trường triển khai | `PROD`, `UAT`, `DEV` (`Required`) |
| `infra_type` | `Enum` | Loại hạ tầng | `VM`, `PHYSICAL`, `CLOUD` (Default: `VM`) |
| `site` | `Enum` | Vị trí trung tâm dữ liệu | `DC`, `DR`, `TEST` |

#### **Model / DTO: HardwareComponent**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `type` | `Enum` | Loại linh kiện | `CPU`, `RAM`, `HDD`, `SSD` (`Required`) |
| `model` | `String` | Tên model linh kiện | `VarChar(255)` |
| `specs` | `Json` | Thông số kỹ thuật chi tiết | Lưu dạng Key-Value (JSON) |

#### **Hằng số & Enums (Constants & Options)**
- `ServerPurpose`: Mục đích sử dụng (`APP_SERVER`, `DB_SERVER`, `PROXY`, ...).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Automatic Code Generation:** Nếu payload tạo Server không cung cấp mã code, hệ thống tự động sinh mã theo pattern `SRV-{ENVIRONMENT}-{UUID}`.
- **Change History Snapshot:** Kích hoạt `ChangeHistoryService`. Mỗi khi có thao tác PATCH/PUT sửa đổi thông tin Server hoặc linh kiện, Backend chụp lại toàn bộ state của object đó và lưu vào bảng `ChangeHistory`.

### 3.2. Tầng Frontend (Client-side Logic)
- **KV Editor cho Thông số phần cứng:** Thay vì nhập JSON thô cho trường `specs`, Form sử dụng `Form.List` của AntD để tạo giao diện nhập liệu Key-Value động (Dynamic Form Items).
- **Hardware Presets Logic:** Frontend lưu trữ các bộ preset key. Khi chọn `HardwareType` là CPU, hệ thống tự điền sẵn các key `cores`, `clock_speed`. Chọn RAM tự điền `capacity`, `bus_speed`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/servers` | `GET` | Lấy danh sách server (Phân trang + Lọc) | `VIEWER` |
| `/api/v1/hardware` | `POST` | Thêm linh kiện vào server | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Duplicate Server Code (Lỗi 409):** Nếu code truyền lên đã tồn tại -> Ném `ConflictException`.
- **Invalid Hardware Attachment (Lỗi 400):** Cố gắng attach linh kiện vào một Server không tồn tại -> Bắt lỗi Foreign Key Constraint ở Prisma và trả về 400.

## 6. Hướng dẫn Bảo trì & Debug

- **Log & Trace:** `AuditLogInterceptor` ghi nhận hành động tạo/sửa Server. Ngoài ra `ChangeHistory` lưu lại bản chụp JSON chi tiết để so sánh old/new.
- **Gotchas / Chú ý:** Khi xoá linh kiện, thực chất hệ thống chuyển trạng thái `deleted_at` (Soft Delete) chứ không hard delete.

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (Server CRUD, Hardware specs logic, KV Editor UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
