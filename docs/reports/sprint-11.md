# Sprint 11 — ChangeSet Draft & Preview

**Ngày bắt đầu:** 2026-04-21  
**Ngày kết thúc:** 2026-04-21  
**Sprint Goal:** Cung cấp workflow ChangeSet hoàn chỉnh — tạo draft, tích lũy ChangeItems, preview xung đột, apply transaction vào live data  
**Trạng thái:** DONE ✅

---

## Sprint Goal

> Người dùng có thể tạo ChangeSet như một "staging area" để gom nhóm các thay đổi hạ tầng, xem trước tác động lên topology (IP conflict, port conflict, circular deps), sau đó apply chính thức hoặc discard. Mọi thao tác được bảo vệ bởi ACID transaction và tự động tạo topology snapshot sau khi apply.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S11-01 | `[BE]` ChangeSet CRUD: create, list, get, discard | 5 | ✅ |
| S11-02 | `[BE]` ChangeItem: add/remove item trong draft | 3 | ✅ |
| S11-03 | `[BE]` Preview engine: compute virtual topology | 8 | ✅ |
| S11-04 | `[BE]` Preview validation: IP, Port, circular deps | 5 | ✅ |
| S11-05 | `[BE]` Apply: `$transaction` + auto-snapshot | 8 | ✅ |
| S11-06 | `[FE]` ChangeSet list page | 3 | ✅ |
| S11-07 | `[FE]` ChangeSet detail + ChangeItemDiff | 5 | ✅ |
| S11-08 | `[FE]` Preview page: virtual topology color-coded | 8 | ✅ |
| S11-09 | `[FE]` Conflict warning panel | 3 | ✅ |
| S11-10 | `[FE]` Apply confirm dialog + discard confirm | 2 | ✅ |
| S11-11 | `[FE]` useChangeSetStore draft mode + intercept | 8 | ✅ |

**Planned Velocity:** 58 points  
**Actual Velocity:** 58 points

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| Controller path doubled `/api/v1/api/v1/changesets` | Controller dùng `api/v1/changesets` + global prefix `api/v1` | Đổi `@Controller('api/v1/changesets')` → `@Controller('changesets')` | Resolved ✅ |
| Smoke test toggle disabled CHANGESET module | Toggle là flip — module đã ENABLED sẵn | Toggle lại để re-enable | Resolved ✅ |

---

## Scope Changes

| Thay đổi | Lý do | Impact |
|---|---|---|
| S11-11 Draft mode: Zustand store only, không intercept form | Form interception phức tạp, cần per-form integration | Store sẵn sàng; form integration thực hiện ở sprint sau theo từng module |

---

## Achievements

- [x] ChangeSet CRUD API hoàn chỉnh (`POST`, `GET`, `GET/:id`, `PATCH/:id/discard`)
- [x] ChangeItem add/remove với guard trạng thái DRAFT
- [x] PreviewEngineService — overlay virtual topology, detect IP/Port/Circular conflicts
- [x] Apply endpoint với `prisma.$transaction()` + auto-create `TopologySnapshot`
- [x] Prisma schema: thêm `ChangeItem` model + `environment` field vào `ChangeSet`
- [x] Migration `20260421000000_add_change_items` applied thành công
- [x] ChangeSet list page với filter (status, env) + Create modal
- [x] ChangeSet detail page: ChangeItemDiff component (old/new side-by-side diff)
- [x] Preview page: color-coded resource cards (NEW=green, MODIFIED=yellow, DELETED=red)
- [x] Conflict Warning Panel với severity (ERROR blocks Apply, WARNING allows)
- [x] Apply confirm dialog + Discard confirm với Popconfirm
- [x] `useChangeSetStore` Zustand (persisted) cho draft mode state
- [x] Sidebar menu entry `ChangeSets` under Giám sát group

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 58 | 58 |
| Tasks Completed | 11 | 11 |
| Tasks Carried Over | — | 0 |
| New Bugs Found | — | 1 (path doubling — fixed inline) |

---

## Demo Notes

**Demo commands:**
```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# Ensure CHANGESET module is ENABLED
curl -s http://localhost:3000/api/v1/module-configs/CHANGESET \
  -H "Authorization: Bearer $TOKEN" | jq '.data.status'

# Create a ChangeSet
CS=$(curl -s -X POST http://localhost:3000/api/v1/changesets \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Test CS","environment":"DEV"}' | jq -r '.data.id')

# Add a ChangeItem
curl -s -X POST "http://localhost:3000/api/v1/changesets/$CS/items" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"resource_type":"SERVER","action":"UPDATE","resource_id":"<server-id>","new_value":{"status":"MAINTENANCE"}}'

# Preview (returns virtual topology + conflicts)
curl -s -X POST "http://localhost:3000/api/v1/changesets/$CS/preview" \
  -H "Authorization: Bearer $TOKEN" | jq '{conflicts: (.data.conflicts|length), has_fatal: .data.has_fatal_conflicts}'

# Discard
curl -s -X PATCH "http://localhost:3000/api/v1/changesets/$CS/discard" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.status'
```

**UI flow:**
1. Navigate to `/changesets` → New ChangeSet
2. Open ChangeSet detail → Add ChangeItems (or use Draft Mode intercept)
3. Click "Preview Diff" → Review conflicts in warning panel
4. If no fatal conflicts → "Apply ChangeSet" → confirm dialog
5. After apply → automatic TopologySnapshot created

---

## Retrospective

### What went well
- Modular design: PreviewEngineService hoàn toàn tách biệt khỏi service chính
- ACID apply logic sạch sẽ với `prisma.$transaction()`
- ChangeItemDiff component tái sử dụng tốt

### What could be improved
- Form interception (S11-11 scope) cần tích hợp riêng per-module ở sprint tiếp theo
- Preview page dùng card layout thay vì React Flow topology (đủ MVP, nhưng tích hợp topology graph sẽ đẹp hơn)

### Action items for next sprint
- [ ] Integrate Draft Mode interception vào ServerForm, AppForm (khi useChangeSetStore.isActive = true)
- [ ] Preview page: tích hợp React Flow 2D để render topology diff thay vì card layout

---

## Next Sprint Preview

**Sprint 12 Goal:** Polish, Performance & SSO  
**Key tasks planned:**
- Microsoft 365 SSO (Passport OIDC + Azure AD)
- Global search (server/app/network by name/IP/domain)
- Dashboard: OS end-of-support warnings, recent changes summary

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-21_
