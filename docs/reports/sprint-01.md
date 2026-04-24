# Sprint 01 — User & UserGroup Management (Backend)

**Ngày:** 2026-04-08 → 2026-04-09 | **Trạng thái:** DONE ✅ | **Velocity:** 32/32 pts

## Tasks Completed

| # | Task | Pts |
|---|---|---|
| S1-01 | POST /users — create local user (ADMIN) | 3 |
| S1-02 | PATCH /users/:id — update name/status/avatar | 2 |
| S1-03 | POST /users/:id/roles — assign role | 2 |
| S1-04 | DELETE /users/:id/roles/:role — remove role | 2 |
| S1-05 | POST /auth/change-password (self) | 2 |
| S1-06 | POST /users/:id/reset-password (ADMIN) | 2 |
| S1-07 | GET /users/:id/login-history | 2 |
| S1-08 | UserGroup CRUD (GET/POST/PATCH/DELETE) | 5 |
| S1-09 | GET /user-groups/:id/members | 2 |
| S1-10 | POST /user-groups/:id/members (bulk add) | 3 |
| S1-11 | DELETE /user-groups/:id/members (bulk remove) | 2 |
| S1-12 | Effective role resolution (direct + group union) in JWT | 3 |
| S1-13 | GlobalExceptionFilter registered globally | 2 |
| S1-14 | TransformInterceptor registered globally | 2 |

## Key Decisions

- Removed ModuleGuard from UserGroupController — USER_MGMT key not in seed; user/group mgmt is always-on core
- Reset-password + change-password both revoke all refresh tokens (force re-login)
- Effective roles stored as union array in JWT; hierarchy enforced per-request by RolesGuard
- TransformInterceptor now active globally — ALL responses wrapped in {data, message, meta?}

## Bugs Fixed During Sprint

1. login-history 500 — query params coerced with +page/+limit in controller
2. user-groups 403 — removed ModuleGuard (USER_MGMT key missing from seed)

## Verify Commands

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/users?limit=5" | jq '{total:.meta.total}'
curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"ops@test.com","full_name":"Ops","password":"Password@123"}' | jq '.data.id'
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/user-groups" | jq '.meta'
curl -s -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"current_password":"Admin@123","new_password":"Admin@123"}' | jq '.data.message'
```

## Retrospective

**Went well:** 14/14 tasks done in 1 session. GlobalExceptionFilter + TransformInterceptor active globally.

**Sprint 2 action items:**
- Frontend must unwrap .data from all API responses (breaking change — Sprint 0 used flat JSON)
- Build Admin UI: Users page, UserGroups page, Modules page

_Report by: Claude Code Agent — 2026-04-09_
