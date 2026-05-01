# Demo CSV Files — SystemManager Import

Bộ dữ liệu mẫu cho chức năng **Import CSV** (`POST /api/v1/import/preview` → `POST /api/v1/import/execute`).  
Kịch bản: hạ tầng ngân hàng gồm 4 hệ thống nghiệp vụ, 3 môi trường (DEV / UAT / PROD), 2 site (DC / DR).

## Thứ tự import

Import theo đúng thứ tự dưới đây vì mỗi file phụ thuộc vào dữ liệu của file trước:

```
1. servers.csv       → tạo InfraSystem + Server + NetworkConfig + Hardware
2. applications.csv  → tạo ApplicationGroup + Application
3. deployments.csv   → tạo AppDeployment + Port records (liên kết application ↔ server)
4. connections.csv   → tạo AppConnection (liên kết app-to-app, resolve target_port_id)
```

## Nội dung từng file

### `servers.csv` — 20 servers

| Cột | Bắt buộc | Giá trị hợp lệ |
|-----|----------|---------------|
| `ip` | ✅ | IPv4 |
| `name` | ✅ | Tên hiển thị |
| `code` | — | Mặc định tự sinh từ IP nếu trống |
| `hostname` | — | FQDN nội bộ |
| `environment` | — | `DEV` / `UAT` / `PROD` (aliases: `dev`, `prod`, `live`...) |
| `site` | — | `DC` / `DR` / `TEST` |
| `purpose` | — | `APP_SERVER` / `DB_SERVER` / `PROXY` / `LOAD_BALANCER` / `CACHE` / `MESSAGE_QUEUE` / `OTHER` |
| `status` | — | `ACTIVE` / `INACTIVE` / `MAINTENANCE` |
| `infra_type` | — | `VIRTUAL_MACHINE` / `PHYSICAL_SERVER` / `CONTAINER` / `CLOUD_INSTANCE` |
| `system` | — | Code của InfraSystem (tự tạo nếu chưa có) |
| `system_name` | — | Tên InfraSystem (dùng khi tạo mới) |
| `os` | — | Tên OS — tự tạo Application sw_type=OS nếu chưa có |
| `cpu` | — | Số cores (integer) |
| `ram` | — | Dung lượng GB (integer) |
| `total_storage_gb` | — | Tổng dung lượng đĩa GB (integer) |
| `description` | — | Mô tả tự do |

**Phân bổ trong file:**
- PROD DC: 10 servers (APP x3, DB x3, GW x1, LB x1, CACHE x1, MQ x1)
- PROD DR: 3 servers (APP x1, DB x1, GW x1)
- UAT TEST: 3 servers (APP x1, DB x1, GW x1)
- DEV TEST: 4 servers (APP x2, DB x1, CACHE x1)

**IP scheme nhất quán theo tầng:**

| Block | PROD DC | PROD DR | UAT | DEV |
|-------|---------|---------|-----|-----|
| App (1x) | 10.11-10.13 | 20.11 | 30.11 | 40.11-40.12 |
| DB (2x) | 10.21-10.23 | 20.21 | 30.21 | 40.21 |
| DMZ/GW (3x) | 10.31 (GW), 10.32 (LB) | 20.31 | 30.31 | — |
| Infra (4x) | 10.41 (Cache), 10.42 (MQ) | — | — | 40.41 |

**InfraSystems sẽ được tự động tạo:**
- `CORE_BANKING` — Hệ thống Core Banking
- `MOBILE_BANKING` — Hệ thống Mobile Banking
- `GATEWAY` — Cổng API & ESB
- `INFRA_COMMON` — Hạ tầng dùng chung

---

### `applications.csv` — 25 ứng dụng

| Cột | Bắt buộc | Giá trị hợp lệ |
|-----|----------|---------------|
| `code` | ✅ | Unique code (upsert key) |
| `name` | ✅ | Tên hiển thị |
| `group_code` | — | Code nhóm ứng dụng (tự tạo nếu chưa có) |
| `version` | — | Phiên bản hiện tại |
| `owner_team` | — | Tên team sở hữu |
| `application_type` | — | `BUSINESS` / `SYSTEM` |
| `description` | — | Mô tả tự do |

**Nhóm ứng dụng trong file:**

| group_code | Số app | Loại |
|-----------|--------|------|
| `CORE_BANKING` | 5 | BUSINESS |
| `INTERNET_BANKING` | 4 | BUSINESS |
| `MOBILE_BANKING` | 3 | BUSINESS |
| `PAYMENT` | 4 | BUSINESS |
| `ADMIN_TOOLS` | 2 | BUSINESS |
| `INFRA_MIDDLEWARE` | 5 | SYSTEM |
| `INFRA_DATABASE` | 2 | SYSTEM |

---

### `deployments.csv` — 56 deployment records *(Sprint 18: multi-port format)*

| Cột | Bắt buộc | Giá trị hợp lệ |
|-----|----------|---------------|
| `application_code` | ✅ | Phải khớp `code` trong applications.csv |
| `server_code` | ✅ | Phải khớp `code` trong servers.csv |
| `environment` | ✅ | `DEV` / `UAT` / `PROD` |
| `version` | ✅ | Phiên bản được deploy |
| `status` | — | `RUNNING` / `STOPPED` / `DEPRECATED` |
| `deployer` | — | Người/team thực hiện deploy |
| `ports` | — | Danh sách port, format: `PORT-PROTOCOL:service_name` cách nhau bởi dấu cách |

**Ví dụ `ports`:**
- `8080-HTTP:rest-api` — 1 port
- `8080-HTTP:rest-api 9092-gRPC:grpc-api` — 2 port (REST + gRPC)

> **Port conflict detection**: Cùng `server_code` + cùng `port` + cùng `protocol` → import thất bại. Mỗi port trong danh sách đều được kiểm tra riêng.

**Phân bổ:**
- PROD: 29 records (DC x24, DR x5) — CORE_CBS và CORE_TRAN mỗi record có 2 port (HTTP + gRPC)
- UAT: 13 records
- DEV: 14 records

**Phân bổ port theo server (đã verify không conflict):**
- `SRV-PROD-APP-001`: 8080, **9092**(gRPC CORE_CBS), 8081, 8084, 3000, 8090, 8095, 9090
- `SRV-PROD-APP-002`: 8082, **9093**(gRPC CORE_TRAN), 8083, 8085, 8086, 8094, 8096, 9091
- `SRV-PROD-APP-003`: 8088, 8092, 8093
- `SRV-PROD-GW-001`: 443(HTTPS), 80(HTTP)
- `SRV-*-DB-*`: 5432(TCP) — mỗi server DB riêng biệt

---

### `connections.csv` — 30 kết nối app-to-app *(Sprint 18: mới)*

| Cột | Bắt buộc | Giá trị hợp lệ |
|-----|----------|---------------|
| `source_app` | ✅ | Mã ứng dụng nguồn (caller) |
| `target_app` | ✅ | Mã ứng dụng đích (callee) |
| `environment` | ✅ | `DEV` / `UAT` / `PROD` |
| `connection_type` | — | `HTTP` / `HTTPS` / `TCP` / `GRPC` / `AMQP` / `KAFKA` / `DATABASE` (mặc định HTTP) |
| `target_port` | — | Port số nguyên trên app đích — để liên kết Port record cho topology |
| `description` | — | Mô tả kết nối |

**Phân bổ:**
- PROD: 16 kết nối (luồng đầy đủ: IB_PORTAL → IB_API → CORE_CBS → CORE_TRAN, MB, PAY, ADMIN)
- UAT: 9 kết nối (subset của PROD)
- DEV: 5 kết nối (luồng cốt lõi)

**Kết nối đáng chú ý:**
- `IB_API → CORE_TRAN (GRPC, port 9093)` — gRPC, liên kết Port record gRPC của CORE_TRAN
- `CORE_CBS → CORE_TRAN (GRPC, port 9093)` — Core Banking gọi Transaction Engine
- `PAY_SWITCH → PAY_GATEWAY (HTTPS, port 443)` — qua cổng thanh toán HTTPS

---

## Sprint 23: Network Zone & Firewall Rule

Ba file mới bổ sung cho Sprint 23. Import theo thứ tự sau (sau khi đã import 4 file cơ sở ở trên):

```
5. network-zones.csv  → tạo NetworkZone (qua UI hoặc POST /api/v1/network-zones)
6. zone-ips.csv       → tham khảo để nhập IP vào zone (bulk import qua UI)
7. firewall-rules.csv → tạo FirewallRule (POST /api/v1/firewall-rules/import)
```

---

### `network-zones.csv` — 15 phân vùng mạng *(Sprint 23, updated)*

> **Lưu ý:** Không có endpoint import hàng loạt cho network zones. Dùng file này để nhập từng zone qua UI (trang `/network-zones`) hoặc gọi `POST /api/v1/network-zones` lần lượt.

| Cột | Bắt buộc | Giá trị hợp lệ |
|-----|----------|---------------|
| `code` | ✅ | Unique per environment — dùng làm key trong firewall-rules.csv |
| `name` | ✅ | Tên hiển thị |
| `zone_type` | — | `LOCAL` / `DMZ` / `DB` / `DEV` / `UAT` / `PROD` / `INTERNET` / `MANAGEMENT` / `STORAGE` / `BACKUP` / `CUSTOM` |
| `environment` | ✅ | `DEV` / `UAT` / `PROD` |
| `color` | — | Hex color cho hiển thị topology (ví dụ `#FF6B6B`) |
| `description` | — | Mô tả vùng mạng |

**Phân bổ zones:**

| Environment | Zones |
|-------------|-------|
| PROD (DC) | `DMZ_PROD`, `APP_PROD`, `DB_PROD`, `INFRA_PROD`, `MGMT_PROD` |
| PROD (DR) | `DMZ_DR`, `APP_DR`, `DB_DR` |
| PROD (External) | `INTERNET` |
| UAT | `DMZ_UAT`, `APP_UAT`, `DB_UAT` |
| DEV | `APP_DEV`, `DB_DEV`, `INFRA_DEV` |

---

### `zone-ips.csv` — 25 IP entries *(Sprint 23, updated)*

> **Lưu ý:** File này là tài liệu tham khảo. Để import IP vào zone, dùng chức năng "Import hàng loạt" trong UI (ZoneIpDrawer → nhập danh sách IP, mỗi dòng một IP/CIDR) hoặc gọi `POST /api/v1/network-zones/:id/ips/bulk` với body `{"ips": ["192.168.10.31", ...]}`.

| Cột | Mô tả |
|-----|-------|
| `zone_code` | Code của zone (khớp với network-zones.csv) |
| `environment` | Môi trường của zone |
| `ip_address` | IPv4 đơn lẻ hoặc CIDR range |
| `label` | Nhãn nhận diện (thường là server code) |
| `description` | Mô tả IP/dải IP |
| `is_range` | `true` nếu là CIDR range, `false` nếu là IP đơn |

**Mapping IP → Server:**

| Zone | Server codes |
|------|-------------|
| `DMZ_PROD` | SRV-PROD-GW-001 **(10.31)**, SRV-PROD-LB-001 **(10.32)** |
| `APP_PROD` | SRV-PROD-APP-001 **(10.11)**, APP-002 **(10.12)**, APP-003 **(10.13)** |
| `DB_PROD` | SRV-PROD-DB-001 **(10.21)**, DB-002 **(10.22)**, DB-003 **(10.23)** |
| `INFRA_PROD` | SRV-PROD-CACHE-001 **(10.41)**, MQ-001 **(10.42)** |
| `MGMT_PROD` | 10.200.0.0/24 (Ops/DBA), 10.200.1.0/24 (Monitoring) |
| `DMZ_DR` | SRV-DR-GW-001 (20.31) |
| `APP_DR` | SRV-DR-APP-001 (20.11) |
| `DB_DR` | SRV-DR-DB-001 (20.21) |
| `DMZ_UAT` | SRV-UAT-GW-001 (30.31) |
| `APP_UAT` | SRV-UAT-APP-001 (30.11) |
| `DB_UAT` | SRV-UAT-DB-001 (30.21) |
| `APP_DEV` | SRV-DEV-APP-001 (40.11), APP-002 (40.12) |
| `DB_DEV` | SRV-DEV-DB-001 (40.21) |
| `INFRA_DEV` | SRV-DEV-CACHE-001 **(40.41)** |
| `INTERNET` | 3 CIDR ranges: VN ISP, VN Mobile, VN Broadband |

---

### `firewall-rules.csv` — 49 rules *(Sprint 23, optimized)*

Import qua `POST /api/v1/firewall-rules/import` (upload file CSV).

| Cột | Bắt buộc | Mô tả |
|-----|----------|-------|
| `name` | ✅ | Tên rule (unique key cho upsert) |
| `environment` | ✅ | `DEV` / `UAT` / `PROD` |
| `source_ip` | — | IP hoặc CIDR nguồn (ví dụ `192.168.10.11` hoặc `192.168.40.0/24`) |
| `source_zone_code` | — | Code của zone nguồn — service tự resolve thành zone_id |
| `server_code` | — | Code server đích (thay thế cho `destination_server_id` UUID) |
| `port_number` | — | Số port đích — service tự lookup port_id qua deployment |
| `destination_zone_code` | — | Code của zone đích — service tự resolve thành zone_id |
| `protocol` | — | `TCP` / `UDP` / `HTTP` / `HTTPS` / `GRPC` / `AMQP` (mặc định `TCP`) |
| `action` | — | `ALLOW` / `DENY` (mặc định `ALLOW`) |
| `status` | — | `ACTIVE` / `INACTIVE` / `PENDING_APPROVAL` / `REJECTED` (mặc định `PENDING_APPROVAL`) |
| `notes` | — | Ghi chú nghiệp vụ |

> **Upsert key:** `source_ip + destination_server_id + destination_port_id + environment` — import lại cùng file sẽ cập nhật rule thay vì tạo trùng.

**Phân bổ rules:**

| Environment | ALLOW | DENY | PENDING | REJECTED | Tổng |
|-------------|-------|------|---------|----------|------|
| PROD | 25 | 4 | 2 | 1 | 32 |
| UAT | 8 | 1 | 0 | 0 | 9 |
| DEV | 7 | 1 | 0 | 0 | 8 |

> **Nguyên tắc thiết kế:** Mỗi rule trong CSV đại diện cho một cặp **source_ip → destination_server:port** duy nhất theo góc nhìn tầng network. Nhiều service trên cùng một server (cùng source IP) đến cùng destination tạo ra **1 firewall rule**, không phải N rules theo số ứng dụng. Same-server loopback calls (app gọi app trên cùng host) không cần firewall rule.

**Các luồng firewall theo layer:**

| Layer | Flow | Rule count |
|-------|------|-----------|
| Internet → DMZ | HTTP/HTTPS vào HAProxy (internet entry point) | 2 |
| DMZ internal | LB → Gateway (HAProxy phân phối đến Nginx và PAY_GW) | 2 |
| DMZ → APP | Nginx + PAY_GW proxy/gọi đến app servers | 4 |
| APP-001 ↔ APP-002 | Cross-server: IB Portal → IB_API, CBS → TRAN, APP-002 → CBS/ACCT/PAY_GW | 4 |
| APP-003 → APP+DB | Mobile Banking → IB_API, IB_AUTH, POSTGRES_MB | 3 |
| APP → DB | App servers (10.11, 10.12) → PostgreSQL Core (10.21) | 2 |
| APP → INFRA | App servers → Redis (6379) và RabbitMQ (5672) | 3 |
| MGMT → Internal | OPS/DBA truy cập DB, Redis; Monitoring scrape metrics | 4 |
| DENY | Chặn internet/DEV/UAT truy cập trực tiếp DB và CBS | 4 |
| PENDING/REJECTED | Partner API, BI analytics, legacy system | 3 |
