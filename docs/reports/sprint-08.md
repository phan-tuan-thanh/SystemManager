# Sprint 08 — Quản lý Kết nối & Port Mapping

**Ngày bắt đầu:** 2026-04-25  
**Ngày kết thúc:** 2026-04-27  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý chi tiết các cổng dịch vụ (Ports) được mở trên mỗi Server và theo dõi luồng giao tiếp (Connections) giữa các ứng dụng Upstream/Downstream.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Port**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `port_number` | `Int` | Số hiệu cổng (VD: 8080) | `Required` |
| `protocol` | `String` | Giao thức (`TCP`, `UDP`) | Default: `TCP` |
| `service_name` | `String` | Tên dịch vụ | `Nullable` |

#### **Model / DTO: AppConnection**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `source_app_id` | `UUID` | Ứng dụng gọi lệnh | Foreign Key |
| `target_app_id` | `UUID` | Ứng dụng nhận lệnh | Foreign Key |
| `connection_type`| `Enum` | Phân loại luồng dữ liệu | `HTTP`, `HTTPS`, `GRPC`, `DB` |
| `environment` | `Enum` | Môi trường giao tiếp | `PROD`, `UAT`, `DEV` |

#### **Hằng số & Enums (Constants & Options)**
- `ConnectionType`: Chuẩn loại giao tiếp, quyết định icon hiển thị và màu sắc đường line trên đồ thị sơ đồ.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Port Conflict Detection:** Khi thêm một Port cho một AppDeployment (đã được gắn với 1 Server), DB thực thi lệnh chặn nếu cặp `(server_id, port_number, protocol)` đã tồn tại trên một ứng dụng khác. 
- **Dependency Tree API:** Cung cấp API đệ quy lấy danh sách **Upstream** (Ai đang gọi tôi) và **Downstream** (Tôi đang gọi ai). API này áp dụng bộ lọc Environment để chỉ thấy các kết nối trong cùng môi trường đang xét.

### 3.2. Tầng Frontend (Client-side Logic)
- **Inline Port CRUD:** Danh sách Port được quản lý ngay trong Tab của chi tiết Deployment (không tạo trang riêng). Hỗ trợ Edit ngay trên ô bảng (Inline editing).
- **Dependency Tab View:** Hiển thị 2 danh sách song song (Nguồn gốc - Đích đến) giúp dễ hình dung luồng dữ liệu vào/ra của ứng dụng hiện tại.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/ports` | `POST` | Khai báo mở port trên server | `OPERATOR` |
| `/api/v1/connections` | `POST` | Định nghĩa kết nối app-to-app | `OPERATOR` |
| `/api/v1/applications/:id/dependencies` | `GET` | Truy vấn cây liên kết | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Port in Use (Lỗi 409):** Ném lỗi `ConflictException` nêu đích danh "Port 80 TCP đã được sử dụng bởi ứng dụng XYZ trên Server này".
- **Self-referencing Connection (Lỗi 400):** Nếu `source_app_id` == `target_app_id`, chặn không cho phép ứng dụng tự tạo kết nối đến chính nó.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi một ứng dụng bị xoá (Soft Delete), các `AppConnection` liên quan của nó vẫn được giữ nguyên nhưng sẽ không hiển thị trên API dependencies trừ khi query có flag `include_deleted`.

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (Port Schema, Connection logic, Dependency UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
