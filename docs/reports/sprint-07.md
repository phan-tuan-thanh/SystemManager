# Sprint 07 — Connection & Audit Log

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-10  
**Sprint Goal:** AppConnection CRUD + Audit Log UI + Change History shared component  
**Trạng thái:** DONE

---

## Sprint Goal

> Sau sprint này, hệ thống có thể quản lý kết nối giữa các ứng dụng (AppConnection), xem đầy đủ lịch sử audit với diff view và export CSV, tra cứu upstream/downstream dependencies của từng app, và xem lịch sử thay đổi cho Application (dùng shared ChangeHistoryTimeline).

---

## Planned Tasks

| # | Task | Points | Assigned | Status |
|---|---|---|---|---|
| S7-01 | `[BE]` AppConnection CRUD: GET, POST, PATCH, DELETE | 5 | Claude | ✅ |
| S7-02 | `[BE]` GET /connections — filter theo env, source, target, protocol | 3 | Claude | ✅ |
| S7-03 | `[BE]` GET /applications/:id/dependencies — upstream + downstream | 3 | Claude | ✅ |
| S7-04 | `[BE]` Audit log: export CSV (stream large result) | 3 | Claude | ✅ |
| S7-05 | `[FE]` Audit Log page: DataTable với full filter | 5 | Claude | ✅ |
| S7-06 | `[FE]` Audit Log: detail modal (old/new value diff view) | 5 | Claude | ✅ |
| S7-07 | `[FE]` Audit Log: export CSV button | 2 | Claude | ✅ |
| S7-08 | `[FE]` Connection list page + CRUD | 5 | Claude | ✅ |
| S7-09 | `[FE]` Dependency view component (upstream/downstream tree) | 5 | Claude | ✅ |
| S7-10 | `[FE]` Change History timeline shared component | 5 | Claude | ✅ |
| S7-11 | `[INT]` E2E test: auth flow | 5 | Claude | ✅ |
| S7-12 | `[INT]` E2E test: CRUD server → hardware → network → app → deployment | 8 | Claude | ✅ |

**Planned Velocity:** 54 points

---

## Daily Notes

### Day 1 (2026-04-10)
- Implemented AppConnection module (connection.module.ts, connection.service.ts, connection.controller.ts, 3 DTOs)
- Added `GET /applications/:id/dependencies` to ApplicationController — imports ConnectionService via ConnectionModule
- Extended AuditController: added `GET /audit-logs/:id` and `GET /audit-logs/export` (CSV streaming)
- AuditService.exportCsv streams in 500-row batches to handle large datasets without memory issues
- Frontend: types (audit.ts, connection.ts), hooks (useAuditLogs.ts, useConnections.ts)
- Frontend: AuditLogPage with DataTable + detail modal + diff view + CSV export
- Frontend: ConnectionListPage with CRUD + DependencyTree modal
- Frontend: ConnectionForm component (React Hook Form patterns via antd Form)
- Frontend: DependencyTree component showing upstream/downstream with env/type tags
- Frontend: Added Change History tab to Application detail page, added useApplicationChangeHistory hook
- Frontend: ApplicationService.getHistory() + GET /applications/:id/change-history endpoint
- E2E: Playwright config + auth.spec.ts (S7-11) + crud-flow.spec.ts (S7-12)
- App.tsx: registered /connections and /audit-logs routes

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| ConnectionModule circular import | ApplicationModule imports ConnectionModule for dependency endpoint | Used @Optional() decorator + module export pattern | Resolved |
| Audit CSV export bypass TransformInterceptor | Need raw Response for streaming | Used @Res() Express Response directly + manual headers | Resolved |

---

## Scope Changes

| Thay đổi | Lý do | Impact |
|---|---|---|
| Added: GET /applications/:id/change-history endpoint | S7-10 required History tab in Application detail | Minor — extends existing ChangeHistoryService |
| Added: buildAuditCsvUrl helper (client-side) | CSV export needs auth token via URL — used direct anchor download | Uses /api/v1 base URL |

---

## Achievements

_Hoàn thành sau sprint:_

- [x] AppConnection CRUD (POST/GET/PATCH/DELETE) với validation và soft delete
- [x] Dependency map cho ứng dụng (upstream + downstream per env)
- [x] Audit Log page với full filter, detail modal (old/new diff), CSV streaming export
- [x] Connection list page với CRUD modal + Dependency tree viewer
- [x] Change History tab được thêm vào Application detail page
- [x] E2E tests: Playwright auth flow + API-level CRUD flow tests
- [x] Hoàn thành Phase 1 Core Modules (S1–S7)

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 54 | 54 |
| Tasks Completed | 12 | 12 |
| Tasks Carried Over | — | 0 |
| New Bugs Found | — | 0 |
| Test Coverage Delta | — | +1 unit test file (connection.service.spec.ts) |

---

## Demo Notes

_Các điểm cần demo / verify sau sprint:_

1. AppConnection CRUD via API
2. Dependency map cho một app có connections
3. Audit Log page với filter và detail modal
4. CSV export audit logs
5. Connection list page + form + dependency tree modal
6. History tab trên Application detail

**Demo commands:**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# List connections
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/connections" | jq '.meta'

# Get dependencies for first app
APP_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/applications?limit=1" | jq -r '.data[0].id')
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/applications/$APP_ID/dependencies" | jq .

# Audit log
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/audit-logs?limit=5" | jq '.meta'

# Export CSV (check headers)
curl -I -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/audit-logs/export"

# Rebuild if needed
docker compose build backend && docker compose up -d backend
```

---

## Retrospective

### What went well
- All 12 tasks completed in one sprint session
- ConnectionModule cleanly isolated — dependencies endpoint added via @Optional() injection pattern
- Audit CSV streaming implementation handles large datasets (batched 500 rows)
- ChangeHistoryTimeline already existed as shared component — just needed Application backend endpoint and frontend hook
- E2E tests written as Playwright API-level tests for reliability (no UI flakiness)

### What could be improved
- The CSV export URL approach requires the frontend to have access to the base URL — may need auth header for production (consider signed URLs or session cookie approach)
- DependencyTree shows a flat list rather than a true tree — acceptable for Phase 1, Phase 2 Topology will provide the visual graph

### Action items for next sprint
- [ ] Sprint 8: Begin Phase 2 — GraphQL schema setup (Apollo Server) + Topology 2D with React Flow
- [ ] Ensure `TOPOLOGY_2D` module is ENABLED before starting Sprint 8
- [ ] Consider adding sidebar nav links for Connections and Audit Logs

---

## Next Sprint Preview

**Sprint 08 Goal:** Topology 2D visualization với React Flow  
**Key tasks planned:**
- GraphQL Apollo Server setup in NestJS
- topology(environment) query — servers + connections + deployments
- React Flow 2D page with node/edge types, zoom/pan, mini-map
- Snapshot browser + compare

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-10_
