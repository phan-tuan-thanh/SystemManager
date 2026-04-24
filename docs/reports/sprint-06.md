# Sprint 06 — Deployment Docs & Application Frontend

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-10  
**Sprint Goal:** File upload cho DeploymentDoc + toàn bộ UI Application & Deployment  
**Trạng thái:** DONE ✅

---

## Sprint Goal

> Người dùng có thể quản lý danh sách ứng dụng (ApplicationGroup + Application + SystemSoftware), xem chi tiết deployment với tiến độ tài liệu, upload preview/final PDF cho từng loại tài liệu, và miễn tài liệu không bắt buộc.

---

## Completed Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S6-01 | `[BE]` File upload service (local disk, MIME validate, 20MB limit) | 5 | ✅ |
| S6-02 | `[BE]` POST /deployments/:id/docs/:docTypeId/preview | 3 | ✅ |
| S6-03 | `[BE]` POST /deployments/:id/docs/:docTypeId/final (PDF only) | 3 | ✅ |
| S6-04 | `[BE]` PATCH /deployments/:id/docs/:docTypeId/waive | 2 | ✅ |
| S6-05 | `[BE]` GET /deployments/:id/docs/:docTypeId/file — stream file | 2 | ✅ |
| S6-06 | `[FE]` ApplicationGroup list + CRUD modal | 3 | ✅ |
| S6-07 | `[FE]` Application list: filter theo group, status | 5 | ✅ |
| S6-08 | `[FE]` Application detail: tabs (Info / Deployments / Ports / Where running) | 8 | ✅ |
| S6-09 | `[FE]` Deployment list: filter theo env, status, app | 5 | ✅ |
| S6-10 | `[FE]` Deployment detail: info + doc progress + stats cards | 8 | ✅ |
| S6-11 | `[FE]` DocUploadCard: preview/final upload + waive modal | 8 | ✅ |
| S6-12 | `[FE]` Port management tab (PortTab) trong Application detail | 3 | ✅ |
| S6-13 | `[FE]` SystemSoftware page + DeploymentDocType admin config | 3 | ✅ |
| S6-14 | `[FE]` "Where is X running?" tab trong Application detail | 3 | ✅ |

**Actual Velocity: 61 points**

---

## Blockers & Decisions

| Item | Quyết định |
|---|---|
| Multer storage | Dùng `memoryStorage()` thay disk storage để validate MIME trước khi ghi file |
| uuid package | Không cài thêm — dùng `randomUUID()` từ Node.js `crypto` built-in |
| PDF viewer inline | Dùng browser native `<a target="_blank">` thay PDF.js (đủ cho sprint này) |
| DeploymentDocType modulo | DEPLOYMENT_DOCS module là EXTENDED (disabled by default); đã thêm route admin để cấu hình |

---

## New Files Created

### Backend
- `packages/backend/src/common/services/file-upload.service.ts` — MIME validate, save file, serve path
- `packages/backend/src/modules/deployment/deployment.service.ts` — thêm uploadPreview, uploadFinal, waiveDoc, serveFile
- `packages/backend/src/modules/deployment/deployment.controller.ts` — thêm 4 doc endpoints
- `packages/backend/src/modules/deployment/deployment.module.ts` — MulterModule + FileUploadService

### Frontend Types
- `packages/frontend/src/types/application.ts` — ApplicationGroup, Application, Port, SystemSoftware, WhereRunning
- `packages/frontend/src/types/deployment.ts` — AppDeployment, DeploymentDetail, DeploymentDoc, DeploymentDocType

### Frontend Hooks
- `packages/frontend/src/hooks/useAppGroups.ts`
- `packages/frontend/src/hooks/useApplications.ts` — applications + system-software + ports
- `packages/frontend/src/hooks/useDeployments.ts` — deployments + doc upload + doc types

### Frontend Pages
- `packages/frontend/src/pages/application/index.tsx` — Application list với tabs Apps/Groups
- `packages/frontend/src/pages/application/[id].tsx` — Application detail (Info/Deployments/Ports/Where running)
- `packages/frontend/src/pages/application/SystemSoftwarePage.tsx`
- `packages/frontend/src/pages/application/components/AppGroupModal.tsx`
- `packages/frontend/src/pages/application/components/AppGroupList.tsx`
- `packages/frontend/src/pages/application/components/ApplicationForm.tsx`
- `packages/frontend/src/pages/application/components/PortTab.tsx`
- `packages/frontend/src/pages/deployment/index.tsx` — Deployment list
- `packages/frontend/src/pages/deployment/[id].tsx` — Deployment detail (Info/Docs/Ports)
- `packages/frontend/src/pages/deployment/components/DeploymentForm.tsx`
- `packages/frontend/src/pages/deployment/components/DocUploadCard.tsx`
- `packages/frontend/src/pages/admin/DeploymentDocTypePage.tsx`

### Updated
- `packages/frontend/src/App.tsx` — 7 new routes
- `packages/frontend/src/components/layout/Sidebar.tsx` — new menu items

---

## Demo Commands

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# List applications
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/applications" | jq '{total: .meta.total}'

# List deployments
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/deployments" | jq '{total: .meta.total}'

# Upload preview doc (replace IDs)
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/doc.pdf" \
  "http://localhost:3000/api/v1/deployments/{id}/docs/{docTypeId}/preview"

# Waive a doc
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reason":"Approved by Director"}' \
  "http://localhost:3000/api/v1/deployments/{id}/docs/{docTypeId}/waive"
```

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 61 | 61 |
| Tasks Completed | 14 | 14 |
| Tasks Carried Over | 0 | 0 |
| New Bugs Found | 0 | 0 |

---

## Retrospective

### What went well
- File upload với multer memoryStorage() cho phép validate MIME ngay trong service trước khi ghi disk
- DocUploadCard component gọn, hiển thị đủ trạng thái PENDING/PREVIEW/COMPLETE/WAIVED
- Tái sử dụng DataTable/PageHeader/StatusBadge từ shared components

### What could be improved
- DeploymentDocType page cần DEPLOYMENT_DOCS module được ENABLED mới truy cập được — cần note cho user
- Port tab trong Application detail: chưa show server/deployment info khi port có deployment_id

### Action items for next sprint
- [ ] Sprint 7: AppConnection CRUD + Audit Log UI

---

## Next Sprint Preview

**Sprint 7 Goal:** AppConnection CRUD + Audit Log UI + Change History timeline  
**Key tasks:**
- GET/POST/PATCH/DELETE /connections
- GET /applications/:id/dependencies (upstream + downstream)
- Audit Log page với DataTable + filter + detail modal + CSV export
- Connection list page + dependency tree view

---

_Report tạo bởi: Claude Sonnet 4.6_  
_Cập nhật lần cuối: 2026-04-10_
