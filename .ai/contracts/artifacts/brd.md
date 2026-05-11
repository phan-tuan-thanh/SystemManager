# BRD: <Title>

[Header per `_header.md`]

**Example**: "Firewall Rule Lifecycle Management" — Enable operators to define, apply, and manage firewall rules across infrastructure with compliance tracking and audit trails.

## Business Goal

DevOps operators need a centralized way to manage firewall rules across DEV/UAT/PROD environments. Currently, rules are configured manually in individual servers, making it hard to track, audit, and enforce consistency. The firewall rules feature will provide operators with a web UI + REST API to create, list, update, and delete rules with automated compliance checks (port validation, conflict detection), full audit trails, and environment isolation. This reduces deployment errors, improves compliance visibility, and enables self-service rule management without requiring infrastructure team involvement for every rule change.

**Who benefits**:
- DevOps operators (primary): Faster, safer rule management
- Platform engineers (secondary): API for automation, baseline for future templating
- Compliance auditors (tertiary): Audit trail of all rule changes

**Why now** (Phase 4):
- Operators have been requesting this feature (feedback from Phase 3)
- Topology module exists to validate rules against live infrastructure
- Audit logging infrastructure in place to track changes
- Team ready for Phase 4 (UX Polish & Maintenance) work

## Stakeholders

| Role | Name / Team | Decision Power | Concerns |
|------|-------------|---|----------|
| **Product Manager** | DevOps team lead | High | Feature prioritization, release timing |
| **DevOps Operator** | 3x operators (Alice, Bob, Carol) | High | Usability, performance, safety |
| **Platform Engineer** | Infrastructure team | Medium | API design, integration with topology/audit |
| **Compliance Officer** | InfoSec team | Medium | Audit trail completeness, access control |
| **Tech Lead** | SystemManager tech lead | High | Technical feasibility, architecture alignment |
| **Frontend Lead** | React team | Medium | UI/UX consistency, accessibility |

## Scope

### In (MVP Phase 4)

- **Create rule**: Operators create rules with name, port, protocol, environment via REST API + React UI
- **Read rules**: List all rules per environment, filter, search, paginate; get single rule by ID
- **Update rule**: Operators modify rule properties (name, port, protocol)
- **Delete rule**: Soft delete (mark deleted_at, don't hard delete) for compliance
- **Validation**: Port range (1-65535), protocol enum (tcp/udp), environment enum (DEV/UAT/PROD)
- **Conflict detection**: Detect when rule port conflicts with existing rules in same environment
- **Audit trail**: Every rule change (create/update/delete) logged to audit_logs with operator, timestamp, changes
- **Environment isolation**: Rules in DEV don't conflict with rules in PROD (separate namespaces)
- **Role-based access**: `firewall:read` for list/get, `firewall:write` for create/update/delete
- **REST API**: Standard CRUD endpoints (GET, POST, PATCH, DELETE) with JSON request/response
- **React UI**: List page (table with filter/pagination), detail page (view rule), create/edit form, delete confirmation

### Out (Phase 5+)

- **Rule templating**: Reusable rule templates (deferred, lower priority)
- **Cross-environment cloning**: Copy rules from DEV → UAT → PROD (manual process for MVP)
- **Advanced notifications**: Slack/email alerts when rules expire (out of scope, nice-to-have)
- **Machine learning suggestions**: Auto-recommend rules based on traffic analysis (future phase)
- **Scheduled rule expiry**: Automatic rule cleanup after N days (future, compliance feature)
- **Rule versioning**: Track rule history and rollback to previous versions (future)
- **Custom validation rules**: Operators define validation policies (complex, deferred)
- **Integration with actual firewalls**: Deploy rules to real firewall devices (infrastructure, not MVP)

## Requirements

| ID | Statement | Priority | Source | Acceptance Criteria |
|----|-----------|----------|--------|---------------------|
| **FR-1** | System shall allow operators to create firewall rules via REST API | MUST | Operator feedback | POST /api/v1/firewall-rules returns 201, rule saved to DB |
| **FR-2** | System shall allow operators to create rules via React UI form | MUST | Operator feedback, Phase 4 goal | Form available at /firewall-rules/create, validates inputs, submits to API |
| **FR-3** | System shall list all firewall rules in selected environment | MUST | MVP requirement | GET /api/v1/firewall-rules returns paginated list, filter by environment works |
| **FR-4** | System shall display single rule details | MUST | User journey requirement | GET /api/v1/firewall-rules/:id returns rule data, detail page loads |
| **FR-5** | System shall allow operators to update rule properties | SHOULD | Enhancement (lower priority than CRUD) | PATCH endpoint works, updates name/port/protocol, audit logged |
| **FR-6** | System shall allow soft deletion of rules | MUST | Compliance requirement (never hard delete) | DELETE sets deleted_at, list filters deleted rules |
| **FR-7** | System shall validate port range (1-65535) | MUST | Technical requirement | Invalid port rejected with 400 Bad Request |
| **FR-8** | System shall validate protocol enum (tcp/udp) | MUST | Business requirement | Invalid protocol rejected with error |
| **FR-9** | System shall validate environment enum (DEV/UAT/PROD) | MUST | Architecture requirement | Invalid environment rejected |
| **FR-10** | System shall detect port conflicts within same environment | MUST | Safety requirement (prevent duplicate rules) | Duplicate port returns 409 Conflict |
| **FR-11** | System shall support environment isolation (DEV rules don't conflict with PROD) | MUST | Technical architecture | Port 22 in DEV and PROD can both exist |
| **FR-12** | System shall log every rule change to audit_logs table | MUST | Compliance requirement | audit_logs shows create/update/delete for each mutation |
| **NR-1** | API response latency shall be < 200ms p95 | MUST | SLO requirement | Load test with 1000 rules, measure latency |
| **NR-2** | List endpoint shall handle 10,000+ rules efficiently | SHOULD | Scalability requirement | Pagination prevents N+1 queries, index on (environment, deleted_at) |
| **NR-3** | System shall support 100+ concurrent operators | SHOULD | Capacity requirement | No race conditions in conflict detection |
| **SEC-1** | All endpoints shall require JWT authentication | MUST | Security requirement (OWASP Top 10) | Requests without auth token return 401 Unauthorized |
| **SEC-2** | Users shall need firewall:read role to list rules | MUST | Role-based access control | Non-operator user cannot list rules (403 Forbidden) |
| **SEC-3** | Users shall need firewall:write role to create/modify rules | MUST | Authorization requirement | Only operators can modify rules |
| **SEC-4** | All input shall be validated before processing | MUST | OWASP Top 10 (injection prevention) | DTO validation in backend, form validation in frontend |
| **USAB-1** | Form shall show clear validation error messages | SHOULD | UX requirement | Invalid port shows "Port must be 1-65535" (inline error) |
| **USAB-2** | Operators shall be able to filter rules by environment | SHOULD | UX workflow | Dropdown or tabs to filter DEV/UAT/PROD separately |

## Assumptions

- **ASM-1**: Topology module provides live port conflict detection (already implemented)
- **ASM-2**: Audit module exists and can log rule mutations (already implemented)
- **ASM-3**: User authentication + role-based access control infrastructure exists (auth module ready)
- **ASM-4**: Database (PostgreSQL) connection pooling configured for concurrent access
- **ASM-5**: React 18 + TanStack Query available in frontend (already in tech stack)
- **ASM-6**: DEV/UAT/PROD environments are isolated (can't cross-pollinate data)
- **ASM-7**: Operators have stable, predictable rule patterns (not adversarial, not malicious)

## Constraints

### Technical Constraints
- **Stack**: Must use NestJS (backend), React 18 (frontend), Prisma ORM (database)
- **Database**: PostgreSQL must support CHECK constraints, indexes, foreign keys
- **Soft delete**: Never hard-delete rules; always use deleted_at timestamp (company policy)
- **Audit logging**: Every mutation must trigger audit_logs insert (compliance requirement)
- **API versioning**: Must use `/api/v1/` path prefix (existing API convention)

### Regulatory/Compliance Constraints
- **Audit trail**: Must maintain complete history of rule changes for compliance audits
- **Role-based access**: Operator role required for all rule modifications (no anonymous access)
- **Environment isolation**: PROD rules must never leak to DEV (data segregation requirement)
- **No hard deletes**: Rules must be recoverable (soft delete mandatory, per InfoSec)

### Business Constraints
- **Timeline**: Must be complete by end of Phase 4 (Q2 2026)
- **Budget**: Dev effort ~3 weeks (2-3 devs), no external tools/licenses
- **Team**: 2-3 backend devs, 2 frontend devs, 1 QA (existing team only)

## Success Metrics

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Feature adoption** | 80% of operators use API/UI within 3 months | Usage analytics (API call count, UI page views) | DevOps team |
| **Error reduction** | 50% fewer firewall misconfiguration incidents | Compare pre/post incident metrics | DevOps team |
| **Operator time saved** | 2 hours/week per operator (vs. manual rule config) | Survey operators post-launch | Product manager |
| **API performance** | List endpoint p95 latency < 200ms | Continuous monitoring (Grafana) | DevOps team |
| **Test coverage** | 80%+ code coverage for new code | Code coverage report in CI/CD | Tech lead |
| **Audit compliance** | 100% of rule changes logged | Audit log completeness check | Compliance officer |
| **Zero data loss** | No rules lost due to feature (even in rollback) | Soft delete verification, backup tests | DevOps team |

## Risks (High-Level)

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Port conflict detection incomplete** | Medium | Rules conflict, break deployments | Topology integration tested thoroughly, conflict detection verified in test suite |
| **Audit log bottleneck** | Low | Logging slows down mutations | Async audit logging, index on audit_logs table, monitor write latency |
| **Operator confusion (UI hard to use)** | Medium | Low adoption despite launch | Design review with operators, usability testing on staging, clear error messages |
| **Role check bypass** | Low | Unauthorized access to PROD rules | Middleware enforces role check, security tests verify access denied for non-operators |
| **Data loss in rollback** | Low | Operators lose rules if deploy fails | Soft delete strategy (data retained), tested rollback procedure |
| **Performance degradation at scale** | Low | API slow with 10k+ rules | Index strategy, pagination, load testing with large dataset |

## Tests / Validation

- [ ] **BRD reviewed** by stakeholders on 2026-05-08:
  - DevOps team lead: ✓ Approved (wants conflict detection as MVP)
  - Tech Lead: ✓ Approved (feasible with existing architecture)
  - Compliance officer: ✓ Approved (audit trail meets requirements)
  - Product manager: ✓ Approved (aligns with Phase 4 goals)

- [ ] **Requirements validation**: Requirements linked to:
  - Epic SM-E24: Firewall Rule Lifecycle (covers all in-scope requirements)
  - User stories SM-120 through SM-127 (each requirement mapped to story)
  - Test cases in `test-cases.md` (each requirement has acceptance test)

- [ ] **Feasibility assessment**: Tech Lead confirms
  - Architecture supports soft delete + audit logging (yes, existing patterns)
  - Topology integration feasible (yes, TopologyService available)
  - Timeline realistic (yes, 3 weeks with team of 4-5)

## Next steps

1. **PO** (`.ai/agents/po.md`):
   - Create Epic SM-E24 "Firewall Rule Lifecycle Management" in Linear
   - Break into user stories (SM-120 through SM-127)
   - Write detailed acceptance criteria for each story
   - Prioritize (MUST/SHOULD/NICE)
   - Stakeholder sign-off on stories

2. **Tech Lead** (`.ai/agents/tech-lead.md`):
   - Technical impact analysis:
     - Can we use existing Prisma patterns? (yes)
     - Topology integration complexity? (medium, 2-3 days)
     - Database migration plan? (additive, safe)
   - Create task breakdown (see `task-breakdown.md`)
   - Estimate effort: ~43 story points (~3 weeks)

3. **Architect** (`.ai/agents/architect.md`):
   - Design API contract (REST endpoints, JSON schema)
   - Design data model (Prisma schema)
   - Design integration points (topology, audit, auth modules)
   - Document design decisions (ADRs)
