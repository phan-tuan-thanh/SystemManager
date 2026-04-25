# Demo CSV Files — SystemManager Import

Bộ dữ liệu mẫu cho chức năng **Import CSV** (`POST /api/v1/import/preview` → `POST /api/v1/import/execute`).  
Kịch bản: hạ tầng ngân hàng gồm 4 hệ thống nghiệp vụ, 3 môi trường (DEV / UAT / PROD), 2 site (DC / DR).

## Thứ tự import

Import theo đúng thứ tự dưới đây vì `deployments.csv` phụ thuộc vào cả server lẫn application đã tồn tại:

```
1. servers.csv       → tạo InfraSystem + Server + NetworkConfig + Hardware
2. applications.csv  → tạo ApplicationGroup + Application
3. deployments.csv   → tạo AppDeployment (liên kết application ↔ server)
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
- PROD DC: 10 servers (APP x3, DB x3, PROXY x1, LB x1, CACHE x1, MQ x1)
- PROD DR: 3 servers (APP x1, DB x1, PROXY x1)
- UAT TEST: 3 servers (APP x1, DB x1, PROXY x1)
- DEV TEST: 4 servers (APP x2, DB x1, CACHE x1)

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

### `deployments.csv` — 56 deployment records

| Cột | Bắt buộc | Giá trị hợp lệ |
|-----|----------|---------------|
| `application_code` | ✅ | Phải khớp `code` trong applications.csv |
| `server_code` | ✅ | Phải khớp `code` trong servers.csv |
| `environment` | ✅ | `DEV` / `UAT` / `PROD` |
| `version` | ✅ | Phiên bản được deploy |
| `status` | — | `RUNNING` / `STOPPED` / `DEPRECATED` |
| `deployer` | — | Người/team thực hiện deploy |
| `port` | — | Port lắng nghe của ứng dụng trên server (1–65535) |
| `protocol` | — | `HTTP` / `HTTPS` / `TCP` / `UDP` / `gRPC` / `MQ` |
| `service_name` | — | Tên định danh dịch vụ (dùng cho topology) |

> **Port conflict detection**: Cùng `server_code` + cùng `port` + cùng `protocol` → import thất bại. Mỗi app trên cùng server phải dùng port khác nhau.

**Phân bổ:**
- PROD: 29 records (DC x24, DR x5)
- UAT: 13 records
- DEV: 14 records

**Phân bổ port theo server (đã verify không conflict):**
- `SRV-PROD-APP-001`: 8080/8081/8084/3000/8090/8095/9090
- `SRV-PROD-APP-002`: 8082/8083/8085/8086/8094/8096/9091
- `SRV-PROD-APP-003`: 8088/8092/8093
- `SRV-PROD-GW-001`: 443(HTTPS)/80(HTTP)
- `SRV-*-DB-*`: 5432(TCP) — mỗi server DB riêng biệt
