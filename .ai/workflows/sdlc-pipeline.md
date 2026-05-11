# Workflow: SDLC pipeline (15 stages, enterprise Agile/Scrum)

Every user request enters at Stage 1. Stages may iterate, but the agent
**never skips** Clarification, Risk Analysis, Test, Documentation, or
Release Preparation without an ADR-level approval.

| #  | Stage                     | Owner role(s)                    | Exit gate                                                                 |
|----|---------------------------|----------------------------------|---------------------------------------------------------------------------|
| 1  | User Request              | Orchestrator                     | Captured in `active-tasks.md` with TASK-id                                |
| 2  | Requirement Clarification | BA                               | All MUST-HAVE answered or explicit assumption logged                      |
| 3  | Business Analysis         | BA + PO                          | BRD + Epic + Stories + AC written                                         |
| 4  | Technical Analysis        | Tech Lead                        | Impact + dependency matrix + complexity estimate written                  |
| 5  | Solution Design           | Architect                        | Tech design + sequence + API + DB plan; ADRs raised                       |
| 6  | Risk Analysis             | Architect + DevOps + QA          | Risk Matrix completed; rollback approved                                  |
| 7  | Task Breakdown            | Tech Lead                        | Tasks created with objective / scope / AC / tech notes / DoD              |
| 8  | Sprint Planning           | Scrum Master + Tech Lead         | Sprint plan + capacity + dependency order                                 |
| 9  | Development               | Senior Dev                       | Code complies with `coding-style.md`; covers AC; PR open                  |
| 10 | Unit Test                 | Senior Dev                       | Coverage threshold met; all green                                         |
| 11 | QA Test                   | QA                               | Positive / negative / edge / regression / integration pass                |
| 12 | Documentation             | Senior Dev + Architect + DevOps  | Architecture, ADR, API, runbook, changelog updated; traceability recorded |
| 13 | Release Preparation       | DevOps + PO                      | Release notes + version + config diff + migration order + flag plan       |
| 14 | Deployment Checklist      | DevOps                           | Production-readiness checklist green; smoke + rollback validated          |
| 15 | Post-release Validation   | DevOps + QA + PO                 | Production smoke + KPI / SLO check; rollback or close                     |

## Loops permitted
- Stage 2 ↔ Stage 2 (more clarification)
- Stage 6 → Stage 5 (re-design when risk too high)
- Stage 11 → Stage 9 (defect found)
- Stage 15 → Stage 9 (post-release defect → rollback or hotfix)

## Skipping a stage
Requires an ADR in `.ai/memory/decisions.md` with explicit human approval.
