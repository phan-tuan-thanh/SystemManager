# Sprint 04 — Network & Server Frontend

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-10  
**Sprint Goal:** Network backend CRUD + toàn bộ UI Server/Hardware/Network  
**Trạng thái:** DONE ✅

---

## Sprint Goal

> Sau sprint này, người dùng có thể quản lý Network Config (IP conflict detection), xem danh sách Server theo môi trường, xem chi tiết Server với đầy đủ tabs Hardware/Network/Apps/History, và thực hiện CRUD inline cho Hardware và Network.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S4-01 | `[BE]` GET /network-configs — list với filter | 3 | ✅ |
| S4-02 | `[BE]` POST /network-configs — IP conflict detection | 5 | ✅ |
| S4-03 | `[BE]` PATCH /network-configs/:id — conflict check | 3 | ✅ |
| S4-04 | `[BE]` DELETE /network-configs/:id — soft delete | 2 | ✅ |
| S4-05 | `[BE]` GET /network-configs/lookup-domain | 3 | ✅ |
| S4-06 | `[FE]` Server list page với env tabs | 5 | ✅ |
| S4-07 | `[FE]` Server detail page với 5 tabs | 8 | ✅ |
| S4-08 | `[FE]` Server create/edit form | 3 | ✅ |
| S4-09 | `[FE]` Hardware tab: CRUD inline + detach | 5 | ✅ |
| S4-10 | `[FE]` Network tab: CRUD inline + IP conflict alert | 5 | ✅ |
| S4-11 | `[FE]` ChangeHistoryTimeline shared component | 3 | ✅ |
| S4-12 | `[FE]` ChangedBadge indicator component | 1 | ✅ |

**Planned Velocity:** 46 points  
**Actual Velocity:** 46 points

---

## Achievements

- [x] **Network module hoàn chỉnh** — 6 endpoints, IP conflict detection (same env + same private_ip → 409)
- [x] **Server list page** — DataTable với env tabs DEV/UAT/PROD, filter status/search, create/edit/delete inline
- [x] **Server detail page** — 5 tabs: Info, Hardware (CRUD+detach), Network (CRUD+conflict alert), Apps, History
- [x] **Shared ChangeHistoryTimeline** — hiển thị CREATE/UPDATE/DELETE/ATTACH/DETACH với field-level diff
- [x] **ChangedBadge** — badge indicator cho resource có change history
- [x] **IP Conflict alert** — Frontend hiển thị Alert component khi backend trả 409 Conflict

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| — | — | — | — |

---

## Scope Changes

Không có thay đổi scope.

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 46 | 46 |
| Tasks Completed | 12 | 12 |
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

# List network configs
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/network-configs?limit=5" | jq '{total: .meta.total}'

# Filter by environment
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/network-configs?environment=DEV" | jq '{total: .meta.total}'

# Domain lookup
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/network-configs/lookup-domain?domain=internal" | jq 'length'

# IP conflict test (should return 409)
SERVER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/servers?environment=DEV&limit=2" | jq -r '.data[1].id')
curl -s -X POST http://localhost:3000/api/v1/network-configs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"server_id\":\"$SERVER_ID\",\"private_ip\":\"10.0.3.5\"}" | jq '.error.message'

# List servers
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/servers?limit=5" | jq '{total: .meta.total}'

# Frontend: http://localhost:5173/servers
```

---

## Retrospective

### What went well
- Network IP conflict detection hoạt động chính xác — scope check đúng theo environment
- Server detail page với lazy-loading history tab (chỉ fetch khi click tab)
- ChangeHistoryTimeline reusable — field-level diff hiển thị rõ ràng

### What could be improved
- Attach hardware form chưa có (chỉ có detach) — attach sẽ cần dropdown chọn server khác
- Hardware Tab hiện không có lịch sử gắn/gỡ inline — dùng chung ChangeHistoryTimeline

### Action items for next sprint
- [ ] Sprint 5: ApplicationGroup + Application + SystemSoftware + Port (conflict detection) + AppDeployment backend

---

## Next Sprint Preview

**Sprint 5 Goal:** Application & AppGroup Backend  
**Key tasks planned:**
- ApplicationGroup CRUD
- Application CRUD + where-running query
- SystemSoftware CRUD
- Port CRUD + conflict detection (same server + port + protocol)
- AppDeployment CRUD + auto-create DeploymentDoc
- DeploymentDocType CRUD

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-10_
