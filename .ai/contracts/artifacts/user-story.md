# User Story: <Title>

[Header per `_header.md`]

**Example**: "As a DevOps operator, I want to create firewall rules via REST API, so that I can automate rule deployment across environments."

## Story

> As a **<persona>** (e.g., DevOps operator, SysAdmin, Platform engineer),  
> I want **<capability>** (e.g., create/read/update/delete firewall rules),  
> so that **<outcome>** (e.g., I can manage network security without manual configuration).

## Priority

**MUST** (required for MVP) | **SHOULD** (valuable, can defer) | **NICE** (nice-to-have, can skip)

## Acceptance Criteria (BDD: Given / When / Then)

Each AC maps to at least one test case (see `test-cases.md`).

**Example**:

- **AC-1: Create rule with valid data**
  - Given I am an authenticated operator with `firewall:write` role
  - When I POST `/api/v1/firewall-rules` with `{ "name": "allow-ssh", "port": 22, "protocol": "tcp", "environments": ["PROD"] }`
  - Then the rule is created, stored in database with `created_at` timestamp, audit logged, and returns `201 Created` with rule ID

- **AC-2: Create rule with invalid port**
  - Given I am an authenticated operator
  - When I POST `/api/v1/firewall-rules` with `{ "name": "bad", "port": 99999 }`
  - Then the API returns `400 Bad Request` with error `INVALID_PORT`

- **AC-3: Create rule with port conflict**
  - Given I am an authenticated operator
  - And a rule already exists for port 22 on the same interface
  - When I POST `/api/v1/firewall-rules` with `{ "name": "conflict", "port": 22 }`
  - Then the API returns `409 Conflict` with suggestion to update existing rule

- **AC-4: UI Form Submit**
  - Given the firewall rules form is open
  - When I fill in rule fields and click "Create Rule"
  - Then form validates inputs, shows errors if invalid, submits to API, and redirects to rule detail page

## Domain constraints (SystemManager-specific)

- **Authentication**: All operations require `Authorization` header with valid JWT token
- **Role-based access**: Operator must have `firewall:write` permission in the environment (see `.ai/rules/global/security.md`)
- **Soft deletes**: Deleted rules must set `deleted_at`, never hard-delete (see IMPLEMENTATION_DETAILS.md)
- **Audit trail**: Every mutation (create/update/delete) triggers `audit_logs` entry with operator, timestamp, changes
- **Environment isolation**: Rules in DEV cannot affect UAT/PROD data (see `.ai/rules/domain/backend.md`)
- **Topology validation**: Check for port/IP conflicts against current infrastructure (see `.ai/memory/integration-map.md`)

## Out of scope

- <Item excluded from this story>

**Example**:
- Rule templating (deferred to future sprint)
- Cross-environment rule cloning (manual process for now)
- Automated compliance policy enforcement (manual review for now)

## Dependencies

- **Stories**: <other stories this depends on>
- **Systems**: <backend modules, frontend services, databases>
- **External**: <third-party APIs, infrastructure, permissions>

**Example**:
- **Stories**: Story SM-120 "Firewall Rule Model" (schema), Story SM-121 "Rule Validation"
- **Systems**: `firewall` module (backend), `topology` module (conflict detection), `audit` module (logging), React hooks for API calls
- **External**: PostgreSQL database running, DEV/UAT/PROD environments configured in docker-compose

## Risks

- <Risk> → <Mitigation>

**Example**:
- **Risk**: API doesn't validate port ranges, allows invalid ports
  - **Mitigation**: Input validation in DTO (class-validator), unit tests for edge cases (0, 65535, -1, 99999)
- **Risk**: Audit log missing if mutation fails halfway
  - **Mitigation**: Use database transaction, log before and after state in audit
- **Risk**: Frontend form doesn't match API validation, confusing users
  - **Mitigation**: Share validation schema between backend (DTO) and frontend (zod schema), E2E test both together

## Tests / Validation

- **Unit tests**: DTO validation, service business logic (create, validate port conflicts)
- **Integration tests**: API endpoint with test database, auth middleware, soft delete behavior
- **E2E tests**: Full user journey in browser (form fill → submit → list view updates)
- **Manual testing**: On staging environment with UAT data, test role-based access (operator vs admin)

See `test-cases.md` for detailed test matrix.

## Notes for next stage

- **Changelog**: New `firewall_rules` table, `POST /api/v1/firewall-rules` endpoint, React form component
- **Migration**: Prisma migration required (see `db-migration.md`)
- **API contract**: RESTful endpoint, JSON request/response (see `api-contract.md`)

## Next steps

1. **Tech Lead** (`.ai/agents/tech-lead.md`):
   - Estimate story in points (e.g., 5 points)
   - Break into tasks (backend CRUD, frontend form, tests, migration)
   - Identify blockers or dependencies on other stories
   - Note in `.ai/memory/active-tasks.md`

2. **Architect** (`.ai/agents/architect.md`):
   - Design API contract (see `api-contract.md`)
   - Prisma schema changes (see `db-migration.md`)
   - Error response format consistency
   - Integration with audit & topology modules

3. **Senior Dev** (`.ai/agents/senior-dev.md`):
   - Implement backend service & controller
   - Implement React form component & hooks
   - Write tests per coverage requirements (80% min)
   - Create PR to `sprint/<N>` branch
