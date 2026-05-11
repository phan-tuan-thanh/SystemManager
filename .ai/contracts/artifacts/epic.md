# Epic: <Title>

[Header per `_header.md`]

**Example**: "Firewall Rule Lifecycle Management" — Enable operators to define, apply, review, and retire firewall rules across production infrastructure.

## Outcome

<Single sentence: what user-visible value this epic delivers to operators/sysadmins managing infrastructure across DEV/UAT/PROD>

**Example**: "Operators can manage firewall rules with automated compliance checks and audit trail across all environments."

## Stories in this epic

| Story ID | Title | Priority | Dependencies | Est. Points | Status |
|----------|-------|----------|--------------|-------------|--------|
| SM-<id> | <story title> | MUST/SHOULD/NICE | <other stories or systems> | <points> | Draft |

## Sequencing rationale

<Why this story order — value delivery, dependency order, risk burn-down>

**Example**:
1. **Firewall Rule Model** (MUST) — Foundation for all stories, no dependencies
2. **Rule CRUD API** (MUST) → depends on rule model
3. **UI List & Detail Pages** (MUST) → depends on rule API
4. **Rule Validation & Compliance** (MUST) → detects errors early, depends on rule model
5. **Audit Logging** (SHOULD) → compliance requirement, independent of UX
6. **Rule Expiry & Notifications** (SHOULD) → lifecycle management, depends on rule model
7. **Topology View Integration** (NICE) → visualization, depends on rule model + topology service

## Domain constraints (SystemManager-specific)

- **Environments**: Rules must respect DEV/UAT/PROD isolation (see `.ai/rules/domain/backend.md`)
- **Changeset workflow**: All production changes must go through changeset approval (see IMPLEMENTATION_DETAILS.md)
- **Soft deletes**: Never hard-delete rules; use `deleted_at` timestamp
- **Audit trail**: Every change logged to `audit_logs` table
- **Port/IP conflicts**: Detect when rules conflict with existing topology
- **Database**: Prisma ORM, PostgreSQL, migrations in `prisma/migrations/`

## Out of scope

- <Item not included in this epic>
- <Deferred to future phase>

**Example**:
- Rules templating (deferred to Phase 4)
- Cross-environment rule cloning (nice-to-have, not critical for MVP)
- Advanced ML-based rule suggestions (future enhancement)

## Risks

- <Risk description> → <Mitigation>

**Example**:
- **Risk**: Port conflicts with running services break deployments
  - **Mitigation**: Implement pre-flight validation against current topology before rule creation
- **Risk**: Missing audit logs on production rule changes
  - **Mitigation**: Unit tests verify all rule mutations trigger audit events; CI enforces coverage

## Tests / Validation

- **Epic acceptance**: All stories marked MUST are complete, tested on UAT with production-like data, and approved by stakeholders
- **Regression**: Existing firewall, topology, and audit modules remain stable
- **Performance**: Rule CRUD operations < 200ms p95 latency (see `.ai/rules/global/performance.md`)
- **Security**: All endpoints require auth + role guard; no SQL injection or XSS vectors (see `.ai/rules/global/security.md`)

## Next steps

1. **Architect** (`.ai/agents/architect.md`):
   - Cross-story API design (REST or GraphQL)
   - Data model & Prisma schema changes
   - Integration touch-points with topology, audit modules
   - Write technical design in `.ai/contracts/artifacts/technical-design.md`

2. **Tech Lead** (`.ai/agents/tech-lead.md`):
   - Dependency matrix across all stories
   - Task breakdown per story (backend, frontend, tests, migrations)
   - Effort estimates (points/days)
   - Identify blockers or critical path items

3. **PO** (`.ai/agents/po.md`):
   - User story acceptance criteria refinement
   - Stakeholder signoff on scope and sequencing
