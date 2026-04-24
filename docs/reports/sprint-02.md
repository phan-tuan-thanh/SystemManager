# Sprint 02 — User & UserGroup Frontend

**Ngày bắt đầu:** 2026-04-09  
**Ngày kết thúc:** 2026-04-09  
**Sprint Goal:** Hoàn thiện toàn bộ Admin UI: Users, UserGroups, Modules, Profile  
**Trạng thái:** DONE ✅

---

## Sprint Goal

> Admin có thể quản lý Users, UserGroups, Modules qua giao diện web đầy đủ. Đồng thời hoàn thiện Dashboard và User Profile page.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S2-01 | `[FE]` AppLayout: notification bell, user dropdown với profile/change-password | 5 | ✅ |
| S2-02 | `[FE]` Dashboard tổng quan: counters từ /system/status, quick links | 3 | ✅ |
| S2-03 | `[FE]` Admin → Users page: DataTable với search + status filter + pagination | 5 | ✅ |
| S2-04 | `[FE]` Admin → Users: Create user modal | 3 | ✅ |
| S2-05 | `[FE]` Admin → Users: Edit user drawer (status, name) | 3 | ✅ |
| S2-06 | `[FE]` Admin → Users: Assign/remove role modal, reset password modal | 3 | ✅ |
| S2-07 | `[FE]` Admin → Users: Login history modal (table) | 2 | ✅ |
| S2-08 | `[FE]` Admin → UserGroups page: CRUD table | 5 | ✅ |
| S2-09 | `[FE]` Admin → UserGroups: Member management drawer (Transfer component) | 5 | ✅ |
| S2-10 | `[FE]` Admin → Modules page: Core/Extended card layout với toggle | 5 | ✅ |
| S2-11 | `[FE]` Admin → Modules: Dependency check modal trước khi toggle | 3 | ✅ |
| S2-12 | `[FE]` User profile page: tabs Info + Change Password | 3 | ✅ |
| S2-13 | `[FE]` TanStack Query hooks: useUsers, useUserGroups, useModuleConfigs | 3 | ✅ |

**Planned Velocity:** 48 points  
**Actual Velocity:** 48 points

---

## Scope Changes

| Thay đổi | Lý do | Impact |
|---|---|---|
| Added: Shared components DataTable, PageHeader, StatusBadge | Cần thiết cho tất cả pages | Tái sử dụng tốt hơn |
| Added: types/user.ts | Tách type cho User, UserGroup, ModuleConfig | Type safety |
| Added: Logging feature (feat/logging branch) | Yêu cầu từ session trước | +19 files, backend LoggerModule |

---

## Achievements

- [x] Toàn bộ Admin pages: Users, UserGroups, Modules, SystemConfig
- [x] User profile với đổi mật khẩu (tự động logout sau đổi)
- [x] Dashboard hiển thị real data từ /system/status
- [x] Notification bell trong Header
- [x] DataTable tái sử dụng với pagination tiếng Việt
- [x] Member management bằng Ant Design Transfer (drag giữa 2 danh sách)
- [x] Module dependency check: chặn bật module nếu deps chưa bật, cảnh báo khi tắt
- [x] StatusBadge tái sử dụng cho ACTIVE/INACTIVE/ENABLED/DISABLED

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 48 | 48 |
| Tasks Completed | 13 | 13 |
| Tasks Carried Over | — | 0 |
| New Bugs Found | — | 0 |
| Docker Build | — | ✅ Both images built successfully |

---

## Demo Notes

1. Login: `http://localhost:5173/login` → `admin@system.local / Admin@123`
2. Dashboard: `/dashboard` — counters từ API, quick links
3. Admin → Người dùng: `/admin/users` — CRUD, role management, reset password, login history
4. Admin → Nhóm người dùng: `/admin/user-groups` — CRUD, member management via Transfer
5. Admin → Modules: `/admin/modules` — toggle EXTENDED modules, dependency check
6. Admin → Cài đặt hệ thống: `/admin/system-config` — log level control
7. Profile: Header dropdown → "Thông tin cá nhân"

**Demo commands:**
```bash
# Verify backend endpoints
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/users" | python3 -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/user-groups" | python3 -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/module-configs" | python3 -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/admin/system-config/logging" | python3 -m json.tool
```

---

## Retrospective

### What went well
- Shared components (DataTable, PageHeader, StatusBadge) giảm code lặp lại đáng kể
- Ant Design Transfer component phù hợp cho member management
- TanStack Query hooks tách biệt rõ ràng khỏi UI components

### What could be improved
- Avatar upload chưa implement (chỉ hiển thị)
- Notification bell chưa có real data (count = 0)
- UserGroups Transfer chưa sync real-time khi members thay đổi ở tab khác

### Action items for next sprint
- [ ] Sprint 3: Backend Server + Hardware modules
- [ ] Thêm avatar upload trong Edit User drawer (Sprint 2.5 hoặc Sprint 6)

---

## Next Sprint Preview

**Sprint 3 Goal:** Server CRUD với filter theo môi trường, Hardware inventory backend  
**Key tasks planned:**
- GET/POST/PATCH/DELETE /api/v1/servers với env filter
- Hardware CRUD: attach/detach server
- ChangeHistory service: auto-snapshot khi PATCH

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-09_
