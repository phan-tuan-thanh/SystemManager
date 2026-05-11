# Workspace AI Operating System

Every agent must follow the loading order below.

## Mandatory loading order

1. `.ai/rules/global/*`           — universal rules
2. `.ai/stack/profile.md`         — what this repo is
3. `.ai/stack/conventions.md`     — repo-specific layout & policy
4. `.ai/stack/commands.md`        — exact build/test/run commands
5. `.ai/contracts/*`              — output guarantees
6. `.ai/rules/domain/<relevant>`  — only if touching that domain
7. `.ai/workflows/<type>.md`      — the workflow you're running
8. `.ai/memory/*`                 — only the relevant entries
9. `.ai/agents/<your-role>.md`    — your lane

## Core rules (never break these)

- Never modify unrelated files (no opportunistic refactors).
- Never invent commands; use `stack/commands.md`.
- Update memory whenever architecture, decisions, or open issues change.
- Follow contracts strictly.
- Check `active-tasks.md` first to avoid duplicate work.

## Workflow selection

| Task type            | Workflow                | Who starts it |
|----------------------|-------------------------|---------------|
| New feature          | `workflows/feature.md`  | Planner       |
| Bug fix              | `workflows/bugfix.md`   | Planner       |
| Code review          | `workflows/review.md`   | Reviewer      |
| Refactor             | `workflows/refactor.md` | Architect     |
| Schema/data change   | `workflows/migration.md`| Architect     |
| Emergency fix        | `workflows/hotfix.md`   | Anyone + approval |
| Release              | `workflows/release.md`  | Release lead  |

## Agent lane assignment (enterprise SDLC)

| Lane         | File                          | Owns                                                                |
|--------------|-------------------------------|---------------------------------------------------------------------|
| BA           | `.ai/agents/ba.md`            | Stage 2–3: clarification, BRD, functional spec                      |
| PO           | `.ai/agents/po.md`            | Stage 3: epic, user story, AC, prioritisation                       |
| Tech Lead    | `.ai/agents/tech-lead.md`     | Stage 4, 7: technical analysis, task breakdown, estimates           |
| Architect    | `.ai/agents/architect.md`     | Stage 5–6: design, API contract, ADRs, risk                         |
| Senior Dev   | `.ai/agents/senior-dev.md`    | Stage 9–10: code, unit tests                                        |
| QA           | `.ai/agents/qa.md`            | Stage 11: test cases, regression, automation, defects               |
| DevOps       | `.ai/agents/devops.md`        | Stage 13–14: deployment, rollback, runbook, prod-readiness          |
| Scrum Master | `.ai/agents/scrum-master.md`  | Stage 8: sprint plan, blockers, ceremonies-as-doc, traceability     |
| Orchestrator | `.ai/agents/orchestrator.md`  | Sequencing, handoff validation, conflict resolution                 |

Lanes are **roles**, not models. One model can play every lane (announce role at start of each response). For larger work, fan out to specialised agents — see `ENTERPRISE_SDLC_ORCHESTRATOR.md` Section 11.

## Enterprise mode

Paste `SYSTEM_PROMPT.md` (at repo root) as the model's system message to enable the full 15-stage SDLC pipeline (`.ai/workflows/sdlc-pipeline.md`), clarification gate (`.ai/workflows/clarification-gate.md`), production-readiness checklist (`.ai/contracts/production-readiness.md`), artifact catalogue (`.ai/contracts/artifacts/`), and command system (`.ai/commands.md`).
