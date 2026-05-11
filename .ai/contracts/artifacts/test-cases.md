# Test Cases: <Story or Feature>

[Header per `_header.md`]

**Example**: "Firewall Rule CRUD API" — Test cases for create, read, update, delete operations with validation, conflict detection, and audit logging.

## Test Matrix

| ID | AC Ref | Type | Test Description | Pre-conditions | Steps | Expected Result | Risk Ref | Automation |
|----|--------|------|------------------|-----------------|-------|------------------|----------|------------|
| TC-1 | AC-1 | Positive | Create valid rule | Operator authenticated in PROD, no existing rule for port 22 | 1. POST /api/v1/firewall-rules {name: "ssh", port: 22, protocol: "tcp", env: "PROD"} | 201 Created, rule saved to DB, audit logged | Port conflict | Unit + Integration |
| TC-2 | AC-2 | Negative | Create rule with invalid port (-1) | Operator authenticated | 1. POST with port: -1 | 400 Bad Request, error: INVALID_PORT | Port validation | Unit |
| TC-3 | AC-2 | Negative | Create rule with invalid port (99999) | Operator authenticated | 1. POST with port: 99999 | 400 Bad Request, error: INVALID_PORT | Port validation | Unit |
| TC-4 | AC-3 | Negative | Create rule with existing port conflict | Operator authenticated, rule exists for port 22 in PROD | 1. POST with port: 22, env: "PROD" | 409 Conflict, error: PORT_ALREADY_IN_USE, suggestion included | Port conflict detection | Integration |
| TC-5 | AC-1 | Positive | Create rule in DEV (isolated from PROD) | Operator authenticated in DEV, same port 22 exists in PROD | 1. POST with port: 22, env: "DEV" | 201 Created (DEV isolation respected) | Environment isolation | Integration |
| TC-6 | AC-1 | Positive | List all rules (filters deleted) | Operator authenticated, 5 rules exist (3 active, 2 deleted) | 1. GET /api/v1/firewall-rules | 200 OK, returns 3 active rules only | Soft delete enforcement | Integration |
| TC-7 | AC-1 | Positive | Get single rule by ID | Operator authenticated, rule SM-123 exists | 1. GET /api/v1/firewall-rules/SM-123 | 200 OK, returns rule data | Auth check | Integration |
| TC-8 | AC-1 | Positive | Update rule (change name) | Operator authenticated, rule exists | 1. PATCH /api/v1/firewall-rules/SM-123 {name: "ssh-updated"} | 200 OK, rule updated, change logged in audit | Audit trail | Integration |
| TC-9 | AC-1 | Positive | Delete rule (soft delete) | Operator authenticated, rule exists | 1. DELETE /api/v1/firewall-rules/SM-123 | 204 No Content, rule.deleted_at set, audit logged | Soft delete | Integration |
| TC-10 | AC-1 | Negative | Create rule without authentication | No auth header | 1. POST /api/v1/firewall-rules {...} | 401 Unauthorized | Auth check | Integration |
| TC-11 | AC-1 | Negative | Create rule with non-operator role | User has "viewer" role, not "firewall:write" | 1. POST /api/v1/firewall-rules {...} | 403 Forbidden, error: INSUFFICIENT_PERMISSIONS | Role-based access | Integration |
| TC-12 | AC-1 | Edge | Create rule with protocol enum | Operator authenticated | 1. POST with protocol: "tcp" (valid) → POST with protocol: "invalid" | First succeeds, second returns 400 | Input validation | Unit |
| TC-13 | AC-1 | Edge | Create rule with very long name (1000 chars) | Operator authenticated | 1. POST with name: "a" * 1000 | 400 Bad Request, error: NAME_TOO_LONG (max 255) | Input validation | Unit |
| TC-14 | - | Integration | Full CRUD flow + audit trail | Operator authenticated, empty DB | 1. Create rule 2. Read rule 3. Update rule 4. Delete rule 5. Query audit logs | Each step succeeds, audit_logs shows 4 entries (create, update, delete) | Audit trail + soft delete | Integration + E2E |
| TC-15 | - | E2E | Frontend form submission | Browser open to firewall-rules/create page, authenticated | 1. Fill form {name, port, protocol, env} 2. Click "Create" 3. Verify list updated | Form validates, submits to API, redirects to list, new rule visible | Frontend integration | E2E (Playwright) |
| TC-16 | - | E2E | Error message display | Browser on create form | 1. Fill invalid port (99999) 2. Submit | Form shows error "Port must be 1-65535" (from frontend validation) | Input validation feedback | E2E |
| TC-17 | - | Performance | List API with 1000 rules | DB has 1000+ firewall_rules | 1. GET /api/v1/firewall-rules?env=PROD | Response time < 200ms p95, returns paginated results | Performance target | Load test |

## Coverage

- **AC coverage**: All 4 ACs from user story covered (create, update, delete, conflict detection)
- **Risk coverage**: 
  - Port validation: TC-2, TC-3, TC-12
  - Conflict detection: TC-4, TC-5 (environment isolation)
  - Audit trail: TC-1, TC-8, TC-9, TC-14
  - Auth check: TC-10, TC-11
  - Soft delete: TC-6, TC-9, TC-14
- **Test types**:
  - Unit: 4 tests (validation, enum, name length)
  - Integration: 10 tests (API + DB)
  - E2E: 3 tests (full browser flows)
  - Performance: 1 test (load)

## Risks & Mitigations

| Risk | Mitigation | Test Case |
|------|-----------|-----------|
| Port conflict undetected | Integration test queries topology before create | TC-4, TC-5 |
| Audit log missing | Integration test verifies audit_logs inserted for every mutation | TC-1, TC-8, TC-9, TC-14 |
| Soft delete bypassed | Integration test filters deleted_at IS NULL | TC-6 |
| Role check bypassed | Integration test with non-operator user, expect 403 | TC-11 |
| Frontend validation mismatch with backend | E2E test submits both valid and invalid data, expects frontend + backend to agree | TC-15, TC-16 |

## Test Automation

**Repeatable tests** (CI/CD pipeline):
- ✅ Unit tests (TC-1-3, TC-12-13): Run on every commit, Jest, `npm test`
- ✅ Integration tests (TC-4-11, TC-14): Run on PR, use test database, seed data
- ✅ E2E tests (TC-15-16): Run nightly on staging, Playwright
- ⏭ Performance tests (TC-17): Run weekly, report trends

**Manual tests** (QA on staging):
- Test with real UAT data (large dataset, mixed rule states)
- Cross-browser testing (Chrome, Firefox, Safari)
- Negative path walkthroughs (what if topology is unavailable?)

## Tests / Validation

- [ ] Unit tests written and passing locally (`npm test`)
- [ ] Integration tests written with test DB, seeded data
- [ ] E2E tests written with Playwright, passing on staging
- [ ] Code coverage: 80% minimum for service logic
- [ ] Tested on DEV environment with mock data
- [ ] Tested on UAT environment with production-like dataset
- [ ] QA signoff on staging before merge to `sprint/<N>`
- [ ] Dry-run on staging on <date> (before production deploy)

## Next steps

1. **Senior Dev** (`.ai/agents/senior-dev.md`):
   - Implement service methods & controllers matching test cases
   - Write unit tests (Jest) and integration tests
   - Ensure coverage ≥ 80%
   - PR to `sprint/<N>` with tests

2. **QA** (`.ai/agents/qa.md`):
   - Create automation plan (see `automation-plan.md`)
   - Automate repeatable tests (E2E, integration)
   - Manual testing on staging with UAT data
   - Regression testing on existing firewall functionality

3. **Tech Lead**:
   - Review test coverage report
   - Verify all risk cases covered
   - Approve tests before code review
