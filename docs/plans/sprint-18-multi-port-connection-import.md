# Sprint 18 — Multi-Port per Deployment & Connection Import

**Mục tiêu:**
1. Cho phép 1 deployment khai báo **nhiều cặp port-protocol** (ví dụ: REST + gRPC, HTTP + HTTPS).
2. Bổ sung tính năng **import kết nối app-to-app** từ CSV để xây dựng topology tự động.

**Branch:** `feat/sprint-18-multi-port-connection-import`
**Thời gian:** 2026-04-25
**SRS Ref:** 4.8.4, 4.8.5

---

## Bối cảnh

Sprint 17 đã import được deployment với **một** port/protocol duy nhất. Thực tế:
- Nhiều service expose cả REST (HTTP) và gRPC trên các port khác nhau.
- Kết nối app-to-app hiện phải nhập thủ công qua UI — không có batch import.

Hai cải tiến này giúp dữ liệu topology phản ánh thực tế hơn và giảm thời gian nhập liệu ban đầu.

---

## 1. Multi-Port per Deployment

### 1.1 Format cột `ports` trong CSV

Thay thế 3 cột `port`, `protocol`, `service_name` bằng **1 cột `ports`** với format:

```
PORT-PROTOCOL:service_name [PORT-PROTOCOL:service_name ...]
```

Quy tắc:
- Cặp port-protocol cách nhau bằng **dấu cách**.
- `PORT-PROTOCOL` bắt buộc, `:service_name` là tùy chọn.
- Protocol viết hoa hoặc thường đều được (normalize về uppercase khi lưu).

Ví dụ:
| Giá trị `ports` | Ý nghĩa |
|---|---|
| `8080-HTTP:rest-api` | REST API port 8080 |
| `8080-HTTP:rest-api 9092-gRPC:grpc-api` | REST + gRPC |
| `443-HTTPS:payment-gw 80-HTTP:health` | HTTPS + HTTP health check |

**Backward compatible:** Nếu file CSV vẫn dùng cột `port`/`protocol`/`service_name` riêng lẻ → hệ thống vẫn xử lý như 1 port duy nhất.

### 1.2 Backend — `parsePortsString()`

```typescript
function parsePortsString(raw: string): Array<{ port: number; protocol: string; serviceName: string | null }> {
  // Split by whitespace, parse each token as "PORT-PROTOCOL:service"
}
```

Đặt tại đầu `import.service.ts` (trước class).

### 1.3 Backend — `validateRows()` (deployment type)

```typescript
// Ưu tiên cột `ports` (multi-port) trước cột `port` (single, backward compat)
if (normalised['ports']) {
  const parsed = parsePortsString(String(normalised['ports']));
  // validate each port is integer 1-65535
  normalised['_parsed_ports'] = parsed as any;
} else if (normalised['port']) {
  // single port validation (cũ)
}
```

### 1.4 Backend — `importDeployment()` (tạo nhiều Port records)

```typescript
const parsedPorts = d['_parsed_ports'] ?? [];
// Backward compat: nếu không có _parsed_ports → dùng port/protocol/service_name
for (const { port, protocol, serviceName } of parsedPorts) {
  // port conflict check trên server
  // create Port record nếu chưa tồn tại
}
```

### Tasks

| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S18-01 | `[BE]` | Thêm `parsePortsString()`, cập nhật `DEPLOYMENT_COLUMNS`, `validateRows` | 2 |
| S18-02 | `[BE]` | Refactor `importDeployment()` — tạo nhiều Port record per deployment | 2 |

---

## 2. Import Kết nối App-to-App (Connection)

### 2.1 CSV Format

**File:** `connections.csv`
**Endpoint:** `POST /api/v1/import/preview?type=connection`

| Cột | Bắt buộc | Mô tả |
|-----|----------|-------|
| `source_app` | ✅ | Code ứng dụng nguồn (caller) |
| `target_app` | ✅ | Code ứng dụng đích (callee) |
| `environment` | ✅ | DEV / UAT / PROD |
| `connection_type` | — | HTTP / HTTPS / TCP / GRPC / AMQP / KAFKA / DATABASE (mặc định HTTP) |
| `target_port` | — | Port số nguyên trên app đích — để liên kết Port record cho topology |
| `description` | — | Mô tả kết nối |

**Header aliases:**
| Alias | Target |
|-------|--------|
| `from_app`, `from`, `source`, `caller` | `source_app` |
| `to_app`, `to`, `target`, `destination`, `callee` | `target_app` |
| `env` | `environment` |
| `type`, `conn_type`, `protocol` | `connection_type` |
| `port`, `dst_port`, `target_port_number` | `target_port` |
| `desc`, `notes`, `ghi_chu`, `mo_ta` | `description` |

**connection_type aliases:**
| CSV value | Canonical |
|-----------|-----------|
| `http` | `HTTP` |
| `https` | `HTTPS` |
| `tcp` | `TCP` |
| `grpc`, `gRPC` | `GRPC` |
| `amqp`, `mq`, `rabbitmq` | `AMQP` |
| `kafka` | `KAFKA` |
| `database`, `db`, `sql` | `DATABASE` |

### 2.2 Upsert Logic

Tìm `AppConnection` theo `(source_app_id, target_app_id, environment, connection_type, deleted_at=null)`:
- Nếu tồn tại → update `description`, `target_port_id`.
- Nếu chưa → tạo mới.

**Port resolution:** Nếu `target_port` được cung cấp, tìm Port record:
```
Port.findFirst { application_id = target_app.id, port_number = target_port,
                 deployment.environment = environment, deleted_at = null }
```
- Tìm thấy → set `target_port_id` để topology render đúng cổng.
- Không tìm thấy → log cảnh báo, connection vẫn được tạo với `target_port_id = null`.

### 2.3 Frontend — `/connection-upload`

UI 4 bước (giống pattern app-upload / deployment-upload):
1. **Tải file** — CSV/Excel
2. **Ánh xạ cột** — ColumnMapper tự động match theo header aliases
3. **Xem trước & Kiểm tra** — DataTable preview với inline edit
4. **Hoàn tất Import** — kết quả với số kết nối tạo mới / cập nhật / thất bại

### Tasks

| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S18-03 | `[BE]` | Thêm `CONNECTION_COLUMNS`, `importConnection()` — upsert AppConnection | 3 |
| S18-04 | `[BE]` | Cập nhật `ImportPreviewDto` + controller để nhận `type=connection` | 1 |
| S18-05 | `[FE]` | Cập nhật `deployment-upload/index.tsx` — thay `port/protocol/service_name` bằng `ports` | 1 |
| S18-06 | `[FE]` | Tạo `pages/connection-upload/index.tsx` — 4-step wizard | 3 |
| S18-07 | `[FE]` | Thêm route `/connection-upload` + Sidebar menu | 1 |
| S18-08 | `[DATA]` | Cập nhật `deployments.csv` sang format `ports` multi-port | 1 |
| S18-09 | `[DATA]` | Tạo `connections.csv` demo — 30 kết nối PROD/UAT/DEV | 2 |

**Sprint 18 Total: 16 points**

---

## Definition of Done

- [ ] S18-01: `parsePortsString()` hoạt động, `_parsed_ports` được lưu trong row.data ✅
- [ ] S18-02: Import deployment với `ports=8080-HTTP:rest 9092-gRPC:grpc` → tạo 2 Port records ✅
- [ ] S18-02: Port conflict detection áp dụng cho từng port trong danh sách ✅
- [ ] S18-02: Backward compat: CSV dùng cột `port`/`protocol`/`service_name` vẫn hoạt động ✅
- [ ] S18-03: Import connection → `AppConnection` được upsert đúng ✅
- [ ] S18-03: `target_port_id` được set khi port tìm được ✅
- [ ] S18-04: `POST /api/v1/import/preview?type=connection` trả về preview ✅
- [ ] S18-05: Deployment upload UI hiển thị hướng dẫn định dạng `ports` ✅
- [ ] S18-06: Connection upload UI — 4 bước hoạt động đầy đủ ✅
- [ ] S18-07: `/connection-upload` accessible sau login, Sidebar hiển thị ✅
- [ ] S18-08: `deployments.csv` — CORE_CBS và CORE_TRAN có 2 ports (HTTP + gRPC) ✅
- [ ] S18-09: `connections.csv` — 30 kết nối, port references hợp lệ ✅
- [ ] TypeScript: 0 lỗi mới ✅

---

## Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

# Preview connections
curl -s -X POST "http://localhost:3000/api/v1/import/preview?type=connection" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@demo/csv/connections.csv" | jq '.data.summary'

# Execute (dùng session_id từ preview)
curl -s -X POST "http://localhost:3000/api/v1/import/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<session_id>"}' | jq '.data.summary'
```
