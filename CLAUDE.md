# Instructions for Claude

This file contains **core rules** for Claude agents working on SystemManager. Always read this before starting any task.

## Project Summary

**SystemManager** is an infrastructure & deployment management system for managing servers, applications, networks, and topology across multiple environments (DEV/UAT/PROD).

- **Architecture**: Modular monolith with independent modules for data, UI, and API
- **Backend**: NestJS + Prisma + PostgreSQL + GraphQL/REST
- **Frontend**: React 18 + TypeScript + Zustand + TanStack Query
- **Phase**: 4 (UX Polish & Maintenance) — current focus on data enrichment and topology refinements

Full details: see [docs/SRS.md](docs/SRS.md) and [AGENTS.md](AGENTS.md)

## Before Every Task

Follow this sequence **in order**:

1. **Read [AGENTS.md](AGENTS.md)** — understand lanes, workflows, and loading order
2. **Load files for your role** (from mandatory loading order in AGENTS.md):
   - `.ai/rules/global/*` — universal rules
   - `.ai/stack/profile.md` — repo definition
   - `.ai/stack/conventions.md` — layout & policies
   - `.ai/stack/commands.md` — exact build/test commands
   - `.ai/contracts/*` — output standards
   - `.ai/rules/domain/<relevant>` — if touching specific domain
   - `.ai/workflows/<task-type>.md` — the workflow you're running
   - `.ai/memory/*` — relevant knowledge
   - `.ai/agents/<your-role>.md` — your lane
3. **Check `.ai/memory/active-tasks.md`** — avoid duplicate work and unblock yourself
4. **Check `.ai/memory/decisions.md`** — learn prior ADRs to avoid rework
5. **Load the workflow file** for your task type (feature, bugfix, review, etc.)

## Role Assignment

Your **default lanes** (play any of these roles at any time, announce role in response):

- **Planner** (starting new work) — understand requirements, create task breakdown
- **Architect** (design phase) — create API contracts, design decisions
- **Implementer/Senior Dev** (coding) — implement features, write tests
- **Reviewer** (quality gates) — code review, security review, test coverage

Choose your lane based on what the task needs **right now**. Example:
- User asks "what should we build?" → Planner/Architect
- User asks "implement the signup form" → Implementer
- User asks "review my PR" → Reviewer

## Output Format

All responses must comply with `.ai/contracts/output-format.md`:

- **Summary** (1-2 sentences: what changed and why)
- **Changed files** (list of files modified)
- **Risks & considerations** (if any)
- **Tests** (how to verify the work)
- **Next steps** (who owns what next)

## Workflow Selection

Don't guess which workflow to use. Refer to the table in [AGENTS.md](AGENTS.md#workflow-selection):

| Task Type | Workflow | Who Starts |
|-----------|----------|-----------|
| New feature | `workflows/feature.md` | Planner → Architect → Implementer |
| Bug fix | `workflows/bugfix.md` | Planner → Implementer |
| Code review | `workflows/review.md` | Reviewer |
| Refactor | `workflows/refactor.md` | Architect |
| Schema change | `workflows/migration.md` | Architect |
| Emergency fix | `workflows/hotfix.md` | Anyone + approval |
| Release | `workflows/release.md` | Release lead |

## When You Finish a Stage

1. **Update `.ai/memory/active-tasks.md`** — mark your stage ✓, set next agent/lane
2. **Update `.ai/memory/decisions.md`** — if you discovered something worth an ADR (Architecture Decision Record)
3. **Append handoff note** — brief note for next agent in canonical format (see `.ai/contracts/pr-checklist.md`)
4. **Commit your work** — following [docs/GUIDES.md](docs/GUIDES.md) and git conventions in CLAUDE.md project section

## Core Rules (Never Break These)

- **Never modify unrelated files** — no opportunistic refactors outside your scope
- **Never invent commands** — use only commands from `.ai/stack/commands.md`
- **Update memory whenever** architecture, decisions, or blockers change
- **Follow contracts strictly** — output format, API design, test coverage, commit style
- **Check active tasks first** — verify you're not duplicating work or ignoring blockers
- **Load order is mandatory** — skipping steps causes inconsistency between agents
- **Always verify assumptions** — before asking user for confirmation, read the actual code/config to confirm

## Communication

- **Terse summaries**: say what changed and why in 1-2 sentences, not "I have completed..."
- **Reference files clearly**: use format `path/file.ts:42` or [file.ts](path/file.ts) for links
- **Show diffs**: paste changed code or use tool results; don't narrate
- **Blockers**: if stuck, explain exactly what's missing and ask for clarification, don't guess

## Important Implementation Notes

See the "Important Implementation Notes" section in CLAUDE.md (project section below) for critical domain rules:
- Module dependency checking
- Soft delete everywhere
- Environment isolation
- ChangeSet workflow constraints
- Topology snapshots
- Port/IP conflict detection
- File upload validation
