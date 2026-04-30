# Đặc tả Chức năng (Functional Specification)

## 1. Module: Quản lý Người dùng (User Management)

### 1.1 Phân quyền RBAC
- 3 roles cố định: `ADMIN`, `OPERATOR`, `VIEWER`
- Role được gán trực tiếp cho user hoặc thừa kế từ UserGroup
- Effective role = union của tất cả roles (direct + group)

### 1.2 Luồng Đăng nhập Local
```
POST /auth/login → nhận JWT pair → lưu access_token (memory) + refresh_token
Khi access_token hết hạn → auto-refresh qua Axios interceptor
Logout → revoke refresh_token → clear store
```

### 1.3 Luồng SSO Microsoft 365
```
GET /auth/ms365 → redirect Microsoft OAuth
→ callback → sync/tạo user trong DB → JWT pair
```

### 1.4 UserGroups
- Nhóm người dùng với `default_role`
- User trong nhóm thừa kế role của nhóm
- Một user có thể thuộc nhiều nhóm

---

## 2. Module: Quản lý Server

### 2.1 Thuộc tính Server
- **Environment:** DEV / UAT / PROD (bắt buộc)
- **Purpose:** APP_SERVER, DB_SERVER, PROXY, LOAD_BALANCER, CACHE, MESSAGE_QUEUE, OTHER
- **InfraType:** VIRTUAL_MACHINE, PHYSICAL_SERVER, CONTAINER, CLOUD_INSTANCE
- **Site:** DC (Data Center PROD), DR (Disaster Recovery), TEST (UAT/DEV)
- **Status:** ACTIVE, INACTIVE, MAINTENANCE

### 2.2 Hardware Components
Mỗi server có thể có nhiều hardware components (CPU, RAM, HDD, SSD, NETWORK_CARD). `specs` là JSON tự do.

### 2.3 Network Configs
- Một server có thể có nhiều network interfaces
- **IP Conflict Detection:** `private_ip` phải unique trong cùng `environment`
- Lỗi 409 Conflict nếu IP đã tồn tại (chỉ check record chưa bị soft delete)

### 2.4 OS Lifecycle Tracking
- OS là `Application` với `application_type=SYSTEM` và `sw_type=OS`
- Mỗi lần cài/nâng cấp OS tạo record `server_os_installs` mới
- `Server.current_os_install_id` → record OS đang dùng
- Trường `replaced_at` null = đang dùng, có giá trị = đã bị thay thế

### 2.5 Import CSV
Format: `code,name,hostname,environment,purpose,infra_type,site,status`

4-step wizard: Upload → Column Mapper → Preview → Import Result

---

## 3. Module: Quản lý Ứng dụng

### 3.1 Application Groups
- `group_type`: `BUSINESS` (nghiệp vụ) hoặc `INFRASTRUCTURE` (hạ tầng)
- Không thể đổi `group_type` sau khi tạo (có apps đang dùng)

### 3.2 Applications
Bao gồm cả ứng dụng nghiệp vụ và system software (đã hợp nhất từ Sprint 16):
- `application_type=BUSINESS` → app nghiệp vụ (thuộc BUSINESS group)
- `application_type=SYSTEM` → phần mềm hệ thống (thuộc INFRASTRUCTURE group)
  - `sw_type`: OS, MIDDLEWARE, DATABASE, RUNTIME, WEB_SERVER
  - `eol_date`: ngày End-of-Life (cảnh báo UI khi gần đến hạn)
  - `vendor`: nhà cung cấp

### 3.3 Import CSV
Format: `code,name,version,group_code,application_type,owner_team`

---

## 4. Module: Deployment

### 4.1 AppDeployment
Mỗi deployment = `app + server + environment + version`.  
Constraint upsert: `(application_id, server_id, environment)` unique (update nếu đã tồn tại).

### 4.2 Multi-Port Deployment
Một deployment có thể expose nhiều ports:
```
CSV: ports column = "8080-HTTP:http-api 9092-GRPC:grpc-service"
Parse: [
  { port_number: 8080, protocol: "HTTP", service_name: "http-api" },
  { port_number: 9092, protocol: "GRPC", service_name: "grpc-service" }
]
```

**Port Conflict Detection:** `(server.id, port_number, protocol)` trong cùng environment phải unique.

### 4.3 Deployment Documents
Tài liệu kỹ thuật kèm theo deployment:
- Workflow: `PENDING → DRAFT → COMPLETE` hoặc `PENDING → WAIVED`
- Preview: cho phép `.pdf`, `.docx`, `.xlsx` (max 20MB)
- Final: chỉ `.pdf` (max 20MB)
- WAIVED: miễn nộp tài liệu với lý do

### 4.4 Import CSV Deployment
Format: `app_code,server_code,environment,version,status,ports`

---

## 5. Module: Connections

### 5.1 AppConnection
Kết nối trực tiếp app-to-app trong một environment.
- `connection_type`: HTTP, HTTPS, TCP, GRPC, AMQP, KAFKA, DATABASE
- `target_port_id`: (optional) chỉ định đến port cụ thể trên app đích

### 5.2 Import CSV
Format: `source_app_code,target_app_code,environment,connection_type,target_port`

### 5.3 Tạo Connection bằng Drag-and-Drop
Trong topology view, bật "Connect Mode" → kéo từ source node đến target node → tự động tạo connection.

---

## 6. Module: Topology

### 6.1 Topology 2D — React Flow

**Nodes:**
- `ServerNode` (rectangular card): hiển thị name, hostname, IP, status badge
- `AppNode` (pill shape): hiển thị app name, protocol badge

**Edges:**
- `ProtocolEdge`: label hiển thị connection type (HTTP/GRPC/v.v.)
- Parallel edges giữa 2 nodes được offset để không chồng lên nhau
- Edge styles: `bezier` (cong) hoặc `step` (góc vuông / orthogonal)

**Layout:**
- `force` (Auto): dagre force-directed layout
- `hierarchical`: phân cấp top-down

**Features:**
- Drag nodes (vị trí được nhớ)
- Mini-map (bật/tắt)
- Fullscreen
- Auto Arrange (chạy lại dagre)
- Connect Mode: drag để tạo connection mới
- Focus highlight: click node → dim các nodes không liên quan

### 6.2 Topology 2D — vis-network
Engine thay thế với physics simulation. Phù hợp khi có nhiều nodes (>50).

### 6.3 Topology 2D — Mermaid
Render diagram tĩnh dạng flowchart. Phù hợp để export/chia sẻ.

### 6.4 Topology 3D — React Three Fiber
Hiển thị 3D explode view, mỗi environment là 1 tầng khác nhau.

### 6.5 Node Visibility Filter
Modal filter để ẩn/hiện nodes:
- Filter theo **Hệ thống** (ApplicationGroup name)
- Filter theo **Server** cụ thể (hiển thị IP)
- Filter theo **Ứng dụng** cụ thể
- Search nhanh trong modal
- Khi có filter: connections đến nodes ẩn cũng bị ẩn theo

### 6.6 Filter Bar
- Environment: DEV / UAT / PROD
- Node type: Servers & Apps / Servers only / Apps only
- Mini-map toggle
- Layout toggle (Auto / Phân cấp)
- Edge style toggle (Cong / Góc vuông)
- Connect Mode button
- Lọc node button (mở modal)

---

## 7. Module: ChangeSet

### 7.1 Workflow ChangeSet
```
Tạo ChangeSet (DRAFT)
→ Thêm ChangeItems (CREATE/UPDATE/DELETE trên bất kỳ resource)
→ Preview: Virtual Topology Engine tính conflict (IP trùng, port trùng)
→ Apply: cập nhật DB + tạo TopologySnapshot
   hoặc Discard: không lưu gì
```

### 7.2 ChangeItem Actions
- `CREATE`: tạo resource mới (new_value = data mới)
- `UPDATE`: sửa resource (old_value = trước, new_value = sau)
- `DELETE`: xóa resource (old_value = data cũ)

### 7.3 Virtual Topology Engine (Preview)
- Lấy dữ liệu baseline (DB hiện tại)
- Overlay tất cả ChangeItems lên baseline
- Kiểm tra conflict:
  - IP private trùng nhau trong cùng environment
  - Port trùng `(server, port, protocol)` trong cùng environment
- Trả về virtual topology + danh sách conflict

---

## 8. Module: Audit Log

### 8.1 Tự động ghi log
Mọi POST/PATCH/DELETE → AuditLogInterceptor tự động ghi, không cần code thêm.

### 8.2 Xem Audit Log
- Filter: user, action, resource_type, resource_id, từ ngày, đến ngày
- Hiển thị diff (old vs new value)
- Export CSV

### 8.3 Change History
Timeline thay đổi của từng resource cụ thể (Server, App, Deployment, v.v.)

---

## 9. Module: Import CSV (Unified)

Trang `/app-import` với 3 tabs:

| Tab | URL | Nội dung |
|-----|-----|----------|
| Ứng dụng | `?tab=app` | Import Applications |
| Deployment | `?tab=deployment` | Import AppDeployments + Ports |
| Kết nối | `?tab=connection` | Import AppConnections |

**4-step wizard mỗi tab:**
1. **Upload:** Kéo thả hoặc chọn file CSV
2. **Column Mapper:** Map cột CSV → trường hệ thống (kéo thả)
3. **Preview & Edit:** Xem trước data, sửa inline
4. **Import Result:** Bảng kết quả per-row (success/error/warning)

**File demo:**
- `demo/csv/deployments.csv` — 56 deployments, bao gồm multi-port
- `demo/csv/connections.csv` — 30 connections PROD/UAT/DEV

---

## 10. Module Configs

### 10.1 Modules có thể bật/tắt

| Module Key | Mô tả | Type |
|-----------|-------|------|
| `USER_MGMT` | Quản lý user | CORE |
| `SERVER_MGMT` | Quản lý server | CORE |
| `APP_MGMT` | Quản lý application | CORE |
| `DEPLOYMENT_MGMT` | Quản lý deployment | CORE |
| `CONNECTION_MGMT` | Quản lý connections | EXTENDED |
| `TOPOLOGY_2D` | Topology 2D | EXTENDED |
| `TOPOLOGY_3D` | Topology 3D | EXTENDED |
| `CHANGESET` | ChangeSet workflow | EXTENDED |
| `AUDIT_LOG` | Audit log viewer | CORE |
| `IMPORT_CSV` | CSV import | EXTENDED |

### 10.2 Module Dependencies
Trước khi enable module, kiểm tra dependencies đã ENABLED. VD: `TOPOLOGY_2D` cần `SERVER_MGMT` và `APP_MGMT`.

---

## 11. System Logging Config

Điều chỉnh runtime qua `/admin/system-config`:

| Key | Giá trị | Mô tả |
|-----|---------|-------|
| `LOG_ENABLED` | `true/false` | Master switch |
| `LOG_LEVEL` | `error/warn/log/debug/verbose` | Mức độ log |
| `LOG_TO_FILE` | `true/false` | Ghi file log |
| `LOG_TO_CONSOLE` | `true/false` | Ghi console |

File log: `logs/app-YYYY-MM-DD.log` (daily rotation, giữ 30 ngày).
