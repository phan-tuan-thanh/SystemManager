# Task Breakdown: <Story or Epic title>

[Header per `_header.md`]

**Example**: "Firewall Rule CRUD API" — Backend and frontend implementation tasks for firewall rules feature.

## Task Matrix

| Task ID | Module | Objective | Scope | Acceptance Criteria | Tech Notes | Test Plan | DoD | Est. (pts) | Blocker | Depends |
|---------|--------|-----------|-------|---------------------|----------|-----------|-----|-----------|---------|----------|
| SM-125-BE-1 | Backend | Firewall rule data model | Prisma schema: firewall_rules table, fields (id, name, port, protocol, environment, created_at, updated_at, deleted_at, created_by_id) | Schema migrated, indexes created, constraints enforced (port 1-65535, environment enum) | See `db-migration.md` | Unit: DTO validation tests, Integration: create/read/delete test rules with DB | Migration tested locally + on staging, soft delete verified, index created, PR merged | 3 | No | None |
| SM-125-BE-2 | Backend | Firewall controller & service | NestJS controller + service for CRUD endpoints (GET, GET/:id, POST, PATCH, DELETE) | All endpoints respond correctly, validate input, check conflicts with topology, log to audit table | Use existing `auth.guard.ts`, `role.guard.ts` decorators; follow pattern from servers module | Unit: validate port/protocol/env, Integration: test all 5 endpoints with DB + auth | Service & Controller implemented, tests passing (80% coverage), follows CONVENTIONS.md, PR merged | 5 | No | SM-125-BE-1 |
| SM-125-BE-3 | Backend | Soft delete & audit logging | Implement soft delete (set deleted_at) + audit trail (insert to audit_logs for every mutation) | Rules with deleted_at set are excluded from list/get queries; audit_logs contains 4 entries per create/update/delete | Use existing audit service from `audit` module; add transaction to guarantee atomicity | Unit: soft delete filter test, Integration: verify audit entries created, E2E: full CRUD + audit check | Soft delete filtering tested, audit entries verified in DB, transactions atomic, PR merged | 3 | No | SM-125-BE-2 |
| SM-125-BE-4 | Backend | Conflict detection (topology integration) | Query `topology` module before create/update to detect port conflicts; return 409 Conflict if port already bound | Conflict detection works for same environment (port 22 in PROD can't create duplicate); DEV isolation respected (port 22 in DEV doesn't conflict with PROD) | Import `TopologyService`, use `checkPortConflict()` method; add caching if topology queries too slow | Unit: mock topology service + test conflict logic, Integration: test against real topology data | Conflict detection tested + passing, environment isolation verified, no false positives, PR merged | 4 | No | SM-125-BE-2 |
| SM-125-FE-1 | Frontend | Firewall rules list page | React page showing table of rules (name, port, protocol, environment), with filter by environment, pagination | Table displays rules, filters work, pagination controls (prev/next), soft-deleted rules hidden | Use TanStack Query for API, `useFirewallRules()` hook, ` useEnvironmentFilter()` for filtering | Component tests: render table, verify filter updates, Integration: test API calls, E2E: full user flow | List page implemented, tests passing, follows CONVENTIONS.md, PR merged | 3 | No | SM-125-BE-2 |
| SM-125-FE-2 | Frontend | Firewall rule detail page | React page showing single rule (read-only initially), with edit & delete buttons | Displays rule data, buttons (Edit, Delete) trigger actions, read-only fields | Link from list page, conditional render (Edit = dialog, Delete = confirm modal) | Component: render detail, Integration: test API call, E2E: navigate from list → detail | Detail page implemented, navigation works, buttons functional, PR merged | 2 | No | SM-125-FE-1 |
| SM-125-FE-3 | Frontend | Firewall rule create/edit form | React form component (name, port, protocol, environment fields) with validation feedback | Form validates inputs (port range, protocol enum), shows errors inline, submits to API, redirects to list | Use React Hook Form + Zod for validation; match backend DTO validation | Component: test validation, integration: test form submit, E2E: full form flow (create + edit) | Form implemented with validation, matches backend specs, tests passing, PR merged | 4 | No | SM-125-FE-1 |
| SM-125-FE-4 | Frontend | Delete confirmation & soft delete | Implement delete button & modal confirmation, handle soft delete response (204 No Content) | Delete button triggers modal, confirm deletes rule, list refreshes and rule disappears | Use existing `ConfirmModal` component, invalidate TanStack Query cache after delete | Component: test modal render, Integration: test API call, E2E: delete + verify removed from list | Delete flow implemented, list updates correctly, tests passing, PR merged | 2 | No | SM-125-FE-3 |
| SM-125-TEST-1 | Testing | Unit tests for service/controller | Jest tests for FirewallService, FirewallController (validation, conflict logic, audit logging) | All unit tests passing, 80% code coverage for service logic | Focus on business logic (port validation, conflict detection), mock external dependencies (topology, audit) | Run `npm test firewall.*.spec.ts`, coverage report | Tests written & passing, coverage 80%+ for service, PR merged | 3 | No | SM-125-BE-2 |
| SM-125-TEST-2 | Testing | Integration tests (API + DB) | API endpoint tests with test database (create rule, verify in DB, soft delete filter) | All integration tests passing, test data cleaned up after each run | Use test fixtures (valid/invalid requests), seed test rules, assert DB state | Run `npm test -- --testPathPattern="firewall.*integration"`, verify DB state | Integration tests written & passing, test DB setup working, PR merged | 4 | No | SM-125-BE-3, SM-125-BE-4 |
| SM-125-TEST-3 | Testing | E2E tests (Playwright) | Browser-based tests for full user journeys (create → list → edit → delete) | E2E tests passing on staging, cover golden path + error cases | Use Playwright, test in Chrome/Firefox, login as operator + viewer role | Run `npm test:e2e firewall`, verify all scenarios pass | E2E tests written, passing on staging, PR merged | 3 | No | SM-125-FE-4 |
| SM-125-TEST-4 | Testing | QA manual testing & regression | QA tests on staging (full UAT cycle), verify no regressions in existing modules (servers, deployments) | QA sign-off, no blockers, test report in Linear | Test cases from `test-cases.md`, testing on staging replica with UAT data | QA test report, regression results, stakeholder sign-off | QA testing completed, sign-off in Linear, PR approved | 2 | No | SM-125-TEST-3 |
| SM-125-DOCS-1 | Documentation | API docs (Swagger) & inline comments | Generate Swagger docs from NestJS decorators, add JSDoc comments to service methods | Swagger spec available at /api/docs, all endpoints documented with examples | Run `npm run gen-api-docs`, commit `docs/api/firewall-rules.yaml`, add @description decorators | Generate docs, verify completeness, visual review | Swagger docs generated & committed, comments added, docs reviewed | 1 | No | SM-125-BE-2 |
| SM-125-DOCS-2 | Documentation | Update CONVENTIONS.md & runbooks | Add firewall rules examples to CONVENTIONS.md, create operator runbook for rule lifecycle | Developers can reference firewall rules pattern, operators have runbook | Link to existing patterns; include examples (create rule, troubleshoot conflict) | Review with Tech Lead, verify examples work | Docs updated, examples tested, reviewed by team | 1 | No | SM-125-BE-2 |
| SM-125-DEPLOY-1 | DevOps | Deployment planning & validation | Prepare deployment plan for DEV → UAT → PROD, test migration on staging, dry-run full deploy | Deployment plan reviewed, migration tested on staging replica, dry-run successful | Coordinate with Tech Lead, validate monitoring alerts, prepare rollback runbook | Dry-run deployment checklist, rollback procedure tested | Deployment plan ready, dry-run completed, rollback tested, PR merged | 2 | No | SM-125-TEST-4 |

## Summary

**Total effort**: ~43 story points  
**Duration**: 2-3 sprints (assuming 10-15 pts/week velocity)  
**Team**: 2-3 backend devs, 2 frontend devs, 1 QA, 1 DevOps  
**Critical path**: SM-125-BE-1 (schema) → SM-125-BE-2 (API) → SM-125-FE-1 (list) → SM-125-TEST-3 (E2E) → SM-125-DEPLOY-1 (deploy)  
**Parallel work possible**: FE-2/FE-3/FE-4 can happen in parallel with BE-3/BE-4; TEST-1 can start after BE-2; DOCS can start anytime

## Definition of Done (per task)

Each task must include:
- [ ] Code written + committed to sprint/<N> branch
- [ ] Unit or integration tests passing (80% coverage minimum)
- [ ] Code reviewed by another developer (non-author)
- [ ] No console.log or debug code left
- [ ] Follows CONVENTIONS.md (naming, structure, error handling)
- [ ] Documentation updated (JSDoc, Swagger, runbooks)
- [ ] All related tests passing locally (`npm test`, `npm run lint`)
- [ ] PR created, all CI checks green
- [ ] Acceptance criteria verified (manual or automated)

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| Topology integration has latency issues | Medium | API response slow if topology service slow | Implement caching; timeout at 1s with fallback |
| Audit log performance degrades with many mutations | Low | Writes slow down | Index audit_logs on (resource_type, created_at); use background async logging |
| Port validation differs between backend/frontend | High | UX confusion (backend rejects valid input) | Share validation schema (Zod) between backend DTO + frontend form |
| Soft delete confusion in team | Medium | Code bugs (forgotten WHERE filter) | Unit tests enforce soft delete filter; code review checklist includes this |
| Testing incomplete, bugs slip to PROD | High | Production issues, rollback needed | Require 80% coverage + QA sign-off before merge to main |

## Tests / Validation

- [ ] **DoD verification**: Each task reviewed for DoD completion before marking done
- [ ] **Integration testing**: Full stack tested (API + DB + frontend) on staging before PROD
- [ ] **QA sign-off**: QA completes manual testing + regression, approves in Linear ticket
- [ ] **Code coverage**: `npm test -- --coverage` shows 80%+ for new code
- [ ] **Performance validation**: List query with 1000+ rules < 200ms p95
- [ ] **Deployment dry-run**: Full deployment tested on staging replica (2026-05-10)

## Next steps

1. **Scrum Master** (`.ai/agents/scrum-master.md`):
   - Load all tasks into Linear (epic + story mapping)
   - Assign to developers based on skills + availability
   - Set sprint dates and iteration plan
   - Create task dependencies in Linear (Depends on field)
   - Daily standup reviews blockers

2. **Tech Lead** (`.ai/agents/tech-lead.md`):
   - Review task breakdown for completeness
   - Verify estimates are realistic
   - Identify critical path (schema → API → E2E → deploy)
   - Ensure DB migration plan approved
   - Coordinate with DevOps on deployment window

3. **Developers** (`.ai/agents/senior-dev.md`):
   - Start SM-125-BE-1 (schema) immediately
   - Pair with other devs on SM-125-BE-2 (API)
   - Submit PR with tests passing
   - Participate in code reviews
