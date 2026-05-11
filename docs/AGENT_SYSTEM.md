# Agent System Guide

This document explains how the agent-based template system works and how to use it effectively.

## Overview

The **agent system** (`.ai/` directory) enables **collaborative, structured development** by defining:

1. **Lanes** (roles) — BA, PO, Tech Lead, Architect, Senior Dev, QA, DevOps, Scrum Master, Orchestrator
2. **Workflows** — feature, bugfix, review, refactor, migration, hotfix, release
3. **Contracts** — output standards (API design, test coverage, commit style, PR checklists)
4. **Memory** — shared knowledge (architecture decisions, active tasks, integration map, coding style)
5. **Rules** — global rules + domain-specific rules
6. **Stack** — profile (what this repo is), conventions (layout, patterns), commands (build/test/run)

## File Structure

```
.ai/
├── agents/                          # Lane-specific instructions
│   ├── ba.md                        # Business Analyst
│   ├── po.md                        # Product Owner
│   ├── tech-lead.md                 # Technical Lead
│   ├── architect.md                 # Solution Architect
│   ├── senior-dev.md                # Senior Developer / Implementer
│   ├── qa.md                        # Quality Assurance
│   ├── devops.md                    # DevOps / Infrastructure
│   ├── scrum-master.md              # Scrum Master
│   └── orchestrator.md              # Work Orchestrator
├── workflows/                       # Task workflow templates
│   ├── feature.md                   # New feature implementation
│   ├── bugfix.md                    # Bug fix workflow
│   ├── review.md                    # Code review workflow
│   ├── refactor.md                  # Refactoring workflow
│   ├── migration.md                 # Database schema change
│   ├── hotfix.md                    # Emergency production fix
│   ├── release.md                   # Release & deployment
│   ├── clarification-gate.md        # Requirement clarification
│   └── sdlc-pipeline.md             # Full 15-stage SDLC (enterprise)
├── contracts/                       # Output standards & guarantees
│   ├── output-format.md             # Required response format
│   ├── api-design.md                # API contracts & standards
│   ├── design-doc.md                # Design document template
│   ├── test-coverage.md             # Minimum test requirements
│   ├── pr-checklist.md              # PR review checklist
│   ├── commit-policy.md             # Commit message standards
│   ├── production-readiness.md      # Go/no-go checklist
│   └── artifacts/                   # Artifact catalogue
├── memory/                          # Shared knowledge base
│   ├── active-tasks.md              # Current work & blockers
│   ├── architecture.md              # Architecture decisions & patterns
│   ├── decisions.md                 # ADRs (Architecture Decision Records)
│   ├── coding-style.md              # Coding conventions & patterns
│   ├── integration-map.md           # Module integration points
│   ├── known-issues.md              # Known bugs & workarounds
│   └── sprint-context.md            # Current sprint goals & focus
├── rules/                           # Rules & constraints
│   ├── global/                      # Universal rules (apply to all)
│   │   ├── security.md              # Security rules & OWASP checklist
│   │   ├── performance.md           # Performance targets & benchmarks
│   │   └── data-handling.md         # Data privacy & compliance
│   └── domain/                      # Domain-specific rules
│       ├── backend.md               # Backend (NestJS) specific
│       ├── frontend.md              # Frontend (React) specific
│       ├── database.md              # Database (Prisma) specific
│       ├── api.md                   # REST/GraphQL API rules
│       └── deployment.md            # Docker & deployment rules
├── stack/                           # Stack definition
│   ├── profile.md                   # Project overview
│   ├── conventions.md               # Code structure conventions
│   └── commands.md                  # Build, test, run commands
└── commands.md                      # (top-level) All commands in one file
```

## Mandatory Loading Order

When starting **ANY task**, load in this exact order:

1. **`.ai/rules/global/*`** — universal rules that apply to everyone
2. **`.ai/stack/profile.md`** — what this repository is
3. **`.ai/stack/conventions.md`** — repo-specific layout and policies
4. **`.ai/stack/commands.md`** — exact build/test/run commands
5. **`.ai/contracts/*`** — output guarantees (format, API design, testing, commits)
6. **`.ai/rules/domain/<relevant>`** — only if touching that domain (backend, frontend, database)
7. **`.ai/workflows/<task-type>.md`** — the workflow for your task (feature, bugfix, review, etc.)
8. **`.ai/memory/*`** — relevant knowledge entries (only the ones that apply)
9. **`.ai/agents/<your-role>.md`** — instructions for your specific lane

**Why this order?**
- Rules first → understand constraints
- Stack definition → understand what we're building
- Commands → use exact commands, not guesses
- Contracts → know output standards before you start
- Domain rules → avoid domain-specific mistakes
- Workflow → understand the process for this task
- Memory → use prior decisions/architecture
- Agent lane → understand your role

## How to Use the System

### Scenario 1: Starting a New Feature

```
User: "Add a new module for firewall rules"

Agent steps:
1. Load AGENTS.md to understand the system
2. Load mandatory files (rules/global, stack, commands, contracts)
3. Play Planner lane: clarify requirements, create task breakdown → update memory/active-tasks.md
4. Handoff to Architect: design API contract, data model → update memory/decisions.md
5. Handoff to Senior Dev: implement module, write tests
6. Handoff to QA: verify test coverage, create E2E tests
7. Handoff to DevOps: prepare deployment, update runbooks
8. PR to sprint/N branch with all changes
```

Each handoff updates `active-tasks.md` to mark stage ✓ and set next agent.

### Scenario 2: Reviewing a Pull Request

```
User: "Review this PR for code quality"

Agent steps:
1. Read AGENTS.md (Reviewer lane)
2. Load .ai/workflows/review.md
3. Load .ai/contracts/pr-checklist.md
4. Check .ai/contracts/api-design.md (if API changed)
5. Check .ai/contracts/test-coverage.md (if code changed)
6. Review code against .ai/rules/domain/backend.md (if backend code)
7. Post review with checklist from PR contract
8. Update memory if discovering new patterns or issues
```

### Scenario 3: Fixing a Production Bug

```
User: "We have a login token refresh bug in production"

Agent steps:
1. Read AGENTS.md (look for hotfix workflow)
2. Load .ai/workflows/hotfix.md
3. Load .ai/rules/global/security.md (since it's auth)
4. Identify root cause
5. Create fix branch: fix/hotfix-token-refresh (from main)
6. Implement fix with tests
7. PR to BOTH main AND active sprint/N branch
8. Coordinate with DevOps for immediate deployment
9. Document incident in memory/known-issues.md
```

## Agent Lanes

### BA (Business Analyst)
**File**: `.ai/agents/ba.md`

Responsible for stages 2-3:
- Clarify vague requirements
- Create Business Requirements Document (BRD)
- Write functional specifications
- Identify stakeholder needs

### PO (Product Owner)
**File**: `.ai/agents/po.md`

Responsible for stage 3:
- Define epics and user stories
- Write acceptance criteria (AC)
- Prioritize work
- Represent stakeholder interests

### Tech Lead
**File**: `.ai/agents/tech-lead.md`

Responsible for stages 4, 7:
- Perform technical analysis
- Break down stories into tasks
- Estimate effort
- Identify technical risks

### Architect
**File**: `.ai/agents/architect.md`

Responsible for stages 5-6:
- Design solution architecture
- Create API contracts
- Write Architecture Decision Records (ADRs)
- Risk assessment
- Tech stack recommendations

### Senior Dev
**File**: `.ai/agents/senior-dev.md`

Responsible for stages 9-10:
- Implement features
- Write unit tests
- Ensure code quality
- Code reviews
- Mentoring junior devs

### QA
**File**: `.ai/agents/qa.md`

Responsible for stage 11:
- Write test cases
- Regression testing
- Test automation
- Defect triage
- QA signoff

### DevOps
**File**: `.ai/agents/devops.md`

Responsible for stages 13-14:
- Deployment planning
- Infrastructure setup
- Rollback procedures
- Runbook creation
- Production readiness

### Scrum Master
**File**: `.ai/agents/scrum-master.md`

Responsible for stage 8:
- Sprint planning
- Blocker identification and resolution
- Ceremony documentation (standups, retros)
- Traceability between stories and commits

### Orchestrator
**File**: `.ai/agents/orchestrator.md`

Coordinates work:
- Sequencing between lanes
- Handoff validation
- Conflict resolution
- Timeline management

## Workflow Types

### Feature Workflow (`.ai/workflows/feature.md`)

Typical flow: Planner → Architect → Senior Dev → QA → DevOps → PR → Sprint

When to use: Implementing new capabilities

### Bugfix Workflow (`.ai/workflows/bugfix.md`)

Typical flow: Planner (identify) → Senior Dev (fix) → QA (verify) → PR → Sprint

When to use: Fixing bugs in existing functionality

### Review Workflow (`.ai/workflows/review.md`)

When to use: Code reviewing pull requests

### Refactor Workflow (`.ai/workflows/refactor.md`)

Typical flow: Architect (design) → Senior Dev (implement) → QA (regression) → PR

When to use: Improving code quality, reducing tech debt

### Migration Workflow (`.ai/workflows/migration.md`)

Typical flow: Architect (design) → Senior Dev (implement) → QA (verify) → DevOps (coordinate) → PR

When to use: Database schema changes, data migrations

### Hotfix Workflow (`.ai/workflows/hotfix.md`)

Typical flow: Senior Dev (fix) → QA (verify) → DevOps (deploy) → PR to main + sprint

When to use: Critical production issues that cannot wait for sprint

### Release Workflow (`.ai/workflows/release.md`)

Typical flow: Tech Lead (plan) → Senior Dev (prepare) → QA (final check) → DevOps (deploy) → PR

When to use: Preparing a production release

## Memory System

`.ai/memory/` contains shared knowledge:

- **`active-tasks.md`** — current work, blockers, who's assigned to what stage
- **`decisions.md`** — Architecture Decision Records (ADRs), why we chose X over Y
- **`architecture.md`** — system architecture, module interactions, patterns
- **`coding-style.md`** — coding conventions, patterns, anti-patterns
- **`integration-map.md`** — which modules depend on which, API contracts
- **`known-issues.md`** — known bugs, workarounds, gotchas
- **`sprint-context.md`** — current sprint goals, priorities, focus areas

**Update memory when:**
- Architecture decisions change
- Discovering blockers or risks
- Finding new patterns or anti-patterns
- Completing a major task

## Contracts & Standards

`.ai/contracts/` defines **output guarantees**:

- **`output-format.md`** — all responses must follow: Summary, Changed files, Risks, Tests, Next steps
- **`api-design.md`** — REST/GraphQL API standards, error responses, versioning
- **`test-coverage.md`** — minimum test requirements (unit, integration, E2E)
- **`pr-checklist.md`** — what to check before merging
- **`design-doc.md`** — template for architecture documents
- **`commit-policy.md`** — commit message format (conventional commits)
- **`production-readiness.md`** — go/no-go checklist before deploy

**Never skip contracts** — they ensure quality and consistency.

## Commands

All build/test/run commands are in `.ai/stack/commands.md`. **Never guess commands**, always use the ones defined there.

Common commands:
- `npm run dev` — start dev server (backend + frontend + db)
- `npm test` — run all tests
- `npm test -- --coverage` — test with coverage report
- `npm run build` — production build
- `npm run lint` — lint code
- `docker compose up -d` — start entire stack in Docker

See `.ai/stack/commands.md` for the complete list.

## Tips for Effective Collaboration

1. **Always read AGENTS.md first** — it's the entry point
2. **Follow loading order strictly** — don't skip steps, it causes inconsistency
3. **Update memory when finishing a stage** — next agent can build on your work
4. **Reference contracts before starting** — know output standards upfront
5. **Use exact commands from stack/commands.md** — avoid "best guesses"
6. **Announce your lane** — so others know your role
7. **Handoff clearly** — mark stage ✓ in active-tasks.md, brief note for next agent
8. **Document decisions** — add to decisions.md so future work doesn't rethink
9. **Check active-tasks first** — avoid duplicate work
10. **Escalate blockers early** — update memory/active-tasks.md immediately

## Example: Full Feature Implementation

```
Sprint 25: "Add firewall rule expiry feature"

Day 1 (Mon):
- BA reads requirements, writes BRD → memory/active-tasks.md: BA ✓ → PO
- PO writes user stories, AC → memory/active-tasks.md: PO ✓ → Tech Lead

Day 2 (Tue):
- Tech Lead estimates (8 points), breaks down tasks → memory/active-tasks.md: Tech Lead ✓ → Architect
- Architect designs DB schema, API endpoints, writes ADR → memory/decisions.md + active-tasks.md: Architect ✓ → Senior Dev

Day 3-4 (Wed-Thu):
- Senior Dev implements backend, frontend, writes tests → PR to sprint/25
- QA reviews test coverage, creates E2E tests → PR approval/feedback

Day 5 (Fri):
- DevOps prepares deployment, updates runbooks → PR merged to sprint/25
- Feature included in sprint 25 release

Friday EOD: Sprint 25 merged to main → production deploy
```

Each handoff: update `active-tasks.md` to mark stage ✓, set next lane, brief note.

## Troubleshooting

**Q: I don't know which workflow to use**
A: Look at the table in AGENTS.md under "Workflow selection"

**Q: I need to use a command but it's not in stack/commands.md**
A: Update stack/commands.md first, then use the new command. Don't invent.

**Q: I'm blocked and don't know how to proceed**
A: Update memory/active-tasks.md with blocker description, assign to orchestrator

**Q: I discovered something important others should know**
A: Update relevant memory file (decisions.md, architecture.md, known-issues.md)

**Q: I'm in the middle of work and need to switch lanes**
A: Update active-tasks.md: mark current stage, note what's complete, who's next

---

See [AGENTS.md](../AGENTS.md) for the complete agent system and [CLAUDE.md](../CLAUDE.md) for Claude-specific instructions.
