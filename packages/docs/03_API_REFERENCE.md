# API Reference

**Base URL:** `http://localhost:3000/api/v1`  
**Swagger UI:** `http://localhost:3000/api/docs`  
**Auth:** Bearer JWT trong header `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/login
Đăng nhập local.

```json
// Request
{ "email": "admin@system.local", "password": "Admin@123" }

// Response 200
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": { "id": "...", "email": "...", "full_name": "...", "roles": ["ADMIN"] }
  }
}
```

### POST /auth/refresh
Gia hạn access token.
```json
// Request
{ "refresh_token": "eyJ..." }
```

### POST /auth/logout
Thu hồi refresh token.

### GET /auth/ms365
Redirect đến Microsoft OAuth login page.

### GET /auth/ms365/callback
Nhận OAuth callback từ Microsoft (tự động xử lý).

### POST /auth/change-password
Đổi mật khẩu (chỉ LOCAL accounts).
```json
{ "current_password": "...", "new_password": "..." }
```

---

## Users

### GET /users
Danh sách users (ADMIN only).  
Query: `page`, `limit`, `search`, `status`, `role`

### POST /users
Tạo user mới (ADMIN only).
```json
{ "email": "...", "full_name": "...", "password": "...", "roles": ["OPERATOR"] }
```

### GET /users/me
Thông tin user hiện tại.

### GET /users/:id
Chi tiết 1 user.

### PATCH /users/:id
Cập nhật user. Fields: `full_name`, `status`, `avatar_url`.

### POST /users/:id/roles
Gán role cho user.
```json
{ "role": "OPERATOR" }
```

### DELETE /users/:id/roles/:role
Gỡ role khỏi user.

### POST /users/:id/reset-password
Reset mật khẩu (ADMIN only).
```json
{ "new_password": "NewPass@123" }
```

---

## User Groups

### GET /user-groups
Danh sách nhóm. Query: `page`, `limit`, `search`.

### POST /user-groups
```json
{ "code": "DEVOPS", "name": "DevOps Team", "default_role": "OPERATOR" }
```

### PATCH /user-groups/:id
### DELETE /user-groups/:id (soft delete)

### GET /user-groups/:id/members
### POST /user-groups/:id/members
```json
{ "user_ids": ["uuid1", "uuid2"] }
```
### DELETE /user-groups/:id/members
```json
{ "user_ids": ["uuid1"] }
```

---

## Servers

### GET /servers
Query: `page`, `limit`, `search`, `environment`, `status`, `purpose`, `infra_type`, `site`

### POST /servers
```json
{
  "code": "SRV-APP-01",
  "name": "App Server 01",
  "hostname": "app-srv-01.internal",
  "environment": "PROD",
  "purpose": "APP_SERVER",
  "infra_type": "VIRTUAL_MACHINE",
  "site": "DC",
  "status": "ACTIVE"
}
```

### GET /servers/:id
Chi tiết server với hardware, network configs, deployments.

### PATCH /servers/:id
### DELETE /servers/:id (soft delete)

### POST /servers/import/preview
Preview import CSV. Body: `multipart/form-data`, field `file`.

### POST /servers/import/confirm
Xác nhận import sau preview.
```json
{ "rows": [...], "mappings": { "name": "Server Name", ... } }
```

---

## Hardware Components

### GET /hardware/:serverId
Danh sách hardware của 1 server.

### POST /hardware
```json
{
  "server_id": "uuid",
  "type": "CPU",
  "model": "Intel Xeon E5-2690",
  "manufacturer": "Intel",
  "specs": { "cores": 16, "threads": 32, "ghz": 2.9 }
}
```

### PATCH /hardware/:id
### DELETE /hardware/:id

---

## Network Configs

### GET /network-configs/:serverId
### POST /network-configs
```json
{
  "server_id": "uuid",
  "interface": "eth0",
  "private_ip": "10.0.0.100",
  "public_ip": null,
  "domain": "app-srv-01.internal",
  "subnet": "10.0.0.0/24",
  "gateway": "10.0.0.1",
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
> `private_ip` phải unique trong cùng environment. Lỗi 409 nếu conflict.

### PATCH /network-configs/:id
### DELETE /network-configs/:id

---

## Application Groups

### GET /app-groups
Query: `page`, `limit`, `search`, `group_type`

### POST /app-groups
```json
{ "code": "CORE_BANKING", "name": "Core Banking", "group_type": "BUSINESS" }
```

### PATCH /app-groups/:id
### DELETE /app-groups/:id

---

## Applications

### GET /applications
Query: `page`, `limit`, `search`, `group_id`, `application_type`, `sw_type`

### POST /applications
```json
{
  "group_id": "uuid",
  "code": "CORE_CBS",
  "name": "Core CBS",
  "version": "3.2.1",
  "application_type": "BUSINESS",
  "owner_team": "Core Banking Team"
}
```

Với SYSTEM app, thêm:
```json
{
  "application_type": "SYSTEM",
  "sw_type": "OS",
  "vendor": "Red Hat",
  "eol_date": "2029-06-30"
}
```

### GET /applications/:id
### PATCH /applications/:id
### DELETE /applications/:id

### POST /applications/import/preview
### POST /applications/import/confirm

---

## Deployments

### GET /deployments
Query: `page`, `limit`, `application_id`, `server_id`, `environment`, `status`

### POST /deployments
```json
{
  "application_id": "uuid",
  "server_id": "uuid",
  "environment": "PROD",
  "version": "3.2.1",
  "status": "RUNNING",
  "title": "Deploy v3.2.1 PROD",
  "deployed_at": "2026-04-01T08:00:00Z",
  "deployer": "John Doe",
  "cmc_name": "CMC-2026-001"
}
```

### GET /deployments/:id
Kèm ports và docs.

### PATCH /deployments/:id
### DELETE /deployments/:id

### POST /deployments/import/preview
### POST /deployments/import/confirm

CSV format: `app_code,server_code,environment,version,status,ports`  
Cột `ports`: `8080-HTTP:http-api 9092-GRPC:grpc-service` (space-separated)

---

## Ports

### GET /ports
Query: `application_id`, `deployment_id`

### POST /ports
```json
{
  "application_id": "uuid",
  "deployment_id": "uuid",
  "port_number": 8080,
  "protocol": "HTTP",
  "service_name": "http-api"
}
```
> Conflict check: `(server_id từ deployment, port_number, protocol)` phải unique trong environment.

### PATCH /ports/:id
### DELETE /ports/:id

---

## Connections

### GET /connections
Query: `page`, `limit`, `source_app_id`, `target_app_id`, `environment`, `connection_type`

### POST /connections
```json
{
  "source_app_id": "uuid",
  "target_app_id": "uuid",
  "environment": "PROD",
  "connection_type": "GRPC",
  "target_port_id": "uuid",
  "description": "gRPC call từ GATEWAY đến CORE_CBS"
}
```

### PATCH /connections/:id
### DELETE /connections/:id

### POST /connections/import/preview
### POST /connections/import/confirm

CSV format: `source_app_code,target_app_code,environment,connection_type,target_port`

---

## Topology (GraphQL)

**Endpoint:** `POST /graphql`

```graphql
query GetTopology($environment: String) {
  topology(environment: $environment) {
    servers {
      id code name hostname status environment site infraType
      networkConfigs { id privateIp publicIp domain interface }
      deployments {
        id status environment version
        application {
          id code name groupName groupId
        }
        ports { id portNumber protocol serviceName }
      }
    }
    connections {
      id sourceAppId targetAppId connectionType environment description
      targetPort { portNumber protocol serviceName }
    }
  }
}
```

**Mutation tạo connection từ drag-drop:**
```graphql
mutation CreateConnection($input: CreateConnectionInput!) {
  createConnection(input: $input) {
    id sourceAppId targetAppId connectionType environment
  }
}
```

---

## Topology Snapshots

### GET /snapshots
Query: `environment`, `page`, `limit`

### POST /snapshots
Tạo snapshot thủ công.
```json
{ "label": "Backup before upgrade", "environment": "PROD" }
```

### GET /snapshots/:id
### DELETE /snapshots/:id

---

## ChangeSets

### GET /changesets
Query: `page`, `limit`, `status`, `environment`

### POST /changesets
```json
{ "title": "Q1 2026 Infrastructure Update", "environment": "PROD" }
```

### GET /changesets/:id
### PATCH /changesets/:id
### DELETE /changesets/:id

### POST /changesets/:id/items
Thêm ChangeItem:
```json
{
  "resource_type": "Server",
  "resource_id": "uuid",
  "action": "UPDATE",
  "new_value": { "status": "MAINTENANCE" }
}
```

### POST /changesets/:id/preview
Chạy Virtual Topology Engine → trả về conflicts.

### POST /changesets/:id/apply
Áp dụng tất cả changes vào DB.

### POST /changesets/:id/discard
Huỷ ChangeSet.

---

## Import (Unified)

### POST /import/preview
Preview import CSV cho bất kỳ loại nào.  
Body: `multipart/form-data`, fields: `file`, `type` (`server|app|deployment|connection`)

Response:
```json
{
  "data": {
    "headers": ["name", "code", ...],
    "rows": [["App Server 1", "SRV-01", ...]],
    "errors": []
  }
}
```

---

## Audit Logs

### GET /audit-logs
Query: `page`, `limit`, `user_id`, `action`, `resource_type`, `resource_id`, `from`, `to`

### GET /audit-logs/export
Export CSV của audit log (ADMIN only).

---

## Module Configs

### GET /module-configs
### PATCH /module-configs/:id
```json
{ "status": "ENABLED" }
```

**Module keys đã có:**
`USER_MGMT`, `SERVER_MGMT`, `APP_MGMT`, `DEPLOYMENT_MGMT`, `CONNECTION_MGMT`, `TOPOLOGY_2D`, `TOPOLOGY_3D`, `CHANGESET`, `AUDIT_LOG`, `IMPORT_CSV`, v.v.

---

## System Config (Admin)

### GET /admin/system-config
### PATCH /admin/system-config
```json
{
  "key": "LOG_LEVEL",
  "value": "debug"
}
```

Keys: `LOG_ENABLED`, `LOG_LEVEL`, `LOG_TO_FILE`, `LOG_TO_CONSOLE`

---

## Chuẩn Response

```typescript
// List
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 20 }
}

// Single
{
  "data": { "id": "...", ... },
  "message": "OK"
}

// Error
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Server with id '...' not found"
  },
  "statusCode": 404
}
```

## HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Chưa đăng nhập |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy |
| 409 | Conflict (IP/port trùng, code đã tồn tại) |
| 422 | Unprocessable (logic error) |
| 500 | Server error |
