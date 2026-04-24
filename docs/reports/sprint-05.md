# Sprint 05 — Application & AppGroup Backend

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-10  
**Sprint Goal:** ApplicationGroup, Application, SystemSoftware, Port, AppDeployment, DeploymentDocType backend  
**Trạng thái:** DONE ✅

---

## Sprint Goal

> Sau sprint này, hệ thống có thể quản lý toàn bộ nhóm ứng dụng, ứng dụng, phần mềm hệ thống, port và triển khai ứng dụng qua API. Bao gồm port conflict detection và auto-tạo DeploymentDoc từ active DocTypes.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S5-01 | `[BE]` ApplicationGroup CRUD: GET, POST, PATCH, DELETE | 3 | ✅ |
| S5-02 | `[BE]` Application CRUD: GET, POST, PATCH, DELETE (soft) | 3 | ✅ |
| S5-03 | `[BE]` GET /applications/:id — với group, active deployments | 2 | ✅ |
| S5-04 | `[BE]` GET /applications/:id/where-running — server list theo env | 3 | ✅ |
| S5-05 | `[BE]` SystemSoftware CRUD | 3 | ✅ |
| S5-06 | `[BE]` DeploymentDocType CRUD (ADMIN only) | 3 | ✅ |
| S5-07 | `[BE]` GET /servers/:id/applications — apps đang chạy trên server | 2 | ✅ |
| S5-08 | `[BE]` Port CRUD: GET, POST, PATCH, DELETE | 3 | ✅ |
| S5-09 | `[BE]` Port conflict detection (same server + port + protocol) | 5 | ✅ |
| S5-10 | `[BE]` AppDeployment CRUD (no file upload yet) | 5 | ✅ |
| S5-11 | `[BE]` GET /deployments/:id — với deployment docs progress | 3 | ✅ |
| S5-12 | `[BE]` Auto-create DeploymentDoc records from active DocTypes | 3 | ✅ |
| S5-13 | `[BE]` ChangeHistory: auto-snapshot khi PATCH application/deployment | 2 | ✅ |

**Planned Velocity:** 40 points  
**Actual Velocity:** 40 points

---

## Achievements

- [x] **AppGroup CRUD** — GET/POST/PATCH/DELETE /app-groups với soft delete + code uniqueness check
- [x] **Application CRUD** — GET/POST/PATCH/DELETE /applications + `where-running` grouping by environment
- [x] **Application detail** — GET /applications/:id với group, active deployments, ports
- [x] **SystemSoftware CRUD** — GET/POST/PATCH/DELETE /system-software + eol_date support
- [x] **DeploymentDocType CRUD** — ADMIN only, behind DEPLOYMENT_DOCS module (EXTENDED)
- [x] **AppDeployment CRUD** — GET/POST/PATCH/DELETE /deployments, POST auto-creates DeploymentDoc records
- [x] **Deployment detail** — GET /deployments/:id với doc_progress (total/complete/waived/pending/pct%)
- [x] **Port CRUD** — GET/POST/PATCH/DELETE /ports
- [x] **Port conflict detection** — 409 khi trùng port_number + protocol trên cùng server (qua deployment)
- [x] **GET /servers/:id/applications** — danh sách deployments trên server với app info
- [x] **ChangeHistory** — auto-snapshot khi PATCH application và PATCH deployment
- [x] **Unit tests** — written for AppGroupService, ApplicationService, DeploymentService, PortService

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| Port conflict detection phức tạp | Port không có server_id trực tiếp — liên kết qua deployment.server_id | Query nested: port → deployment → server, check trùng port_number + protocol | Resolved ✅ |
| DeploymentDocType module | DEPLOYMENT_DOCS là EXTENDED module, disabled by default | Endpoint hoạt động khi module enabled. Seeded deployments không có docs (tạo trước DocTypes). Chỉ new deployments mới auto-create docs | Resolved ✅ |

---

## Scope Changes

Không có thay đổi scope.

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 40 | 40 |
| Tasks Completed | 13 | 13 |
| Tasks Carried Over | 0 | 0 |
| New Bugs Found | 0 | 0 |

---

## Demo Notes

**Demo commands:**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# List app groups
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/app-groups" | jq '{total: .meta.total}'

# List applications
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/applications" | jq '{total: .meta.total}'

# Application where-running
APP_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/applications?limit=1" | jq -r '.data[0].id')
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/applications/$APP_ID/where-running" | jq 'keys'

# List system software
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/system-software" | jq '{total: .meta.total}'

# List deployments
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/deployments" | jq '{total: .meta.total}'

# Deployment detail with doc_progress
DEPL_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/deployments?limit=1" | jq -r '.data[0].id')
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/deployments/$DEPL_ID" | jq '{doc_progress: .data.doc_progress}'

# Ports
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/ports" | jq '{total: .meta.total}'

# Port conflict test (should 409)
DEPL=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/deployments?limit=1" | jq -r '.data[0].id')
APP=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/deployments?limit=1" | jq -r '.data[0].application.id')
EXISTING_PORT=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/ports?deployment_id=$DEPL&limit=1" | jq -r '.data[0].port_number')
curl -s -X POST http://localhost:3000/api/v1/ports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"application_id\":\"$APP\",\"deployment_id\":\"$DEPL\",\"port_number\":$EXISTING_PORT}" | jq '.error.message'

# Servers applications
SRV_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/servers?limit=1" | jq -r '.data[0].id')
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/servers/$SRV_ID/applications" | jq '{count: (.data | length)}'
```

---

## Retrospective

### What went well
- Port conflict detection qua nested join (port → deployment → server) hoạt động chính xác
- Auto-create DeploymentDoc records từ active DocTypes khi tạo deployment
- Deployment detail endpoint trả về doc_progress % tính toán trực tiếp
- ChangeHistory integration tái dùng ChangeHistoryModule không cần viết lại

### What could be improved
- Seeded deployments không có docs (tạo trước khi DocTypes exist) — cần migration script hoặc reseed
- Port model không có server_id trực tiếp → conflict check phải join qua deployment, ít rõ ràng hơn

### Action items for next sprint
- [ ] Sprint 6: File upload cho DeploymentDoc + toàn bộ UI Application/Deployment

---

## Next Sprint Preview

**Sprint 6 Goal:** Deployment Docs File Upload + Application/Deployment Frontend UI  
**Key tasks planned:**
- File upload service (local disk, MIME validate, 20MB)
- POST /deployments/:id/docs/:docTypeId/preview — upload preview
- POST /deployments/:id/docs/:docTypeId/final — upload final (PDF only)
- ApplicationGroup list + CRUD modal
- Application list + detail (tabs: Info / Deployments / Ports)
- Deployment list + detail (management info + doc progress tracker)

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-10_
