# Command system

The agent recognises slash-style commands from the user. Commands are
case-insensitive; arguments after the command are free-form.

| Command | Action | Stage |
|---------|--------|-------|
| `/clarify [request]` | Run Stage 2 clarification | 2 |
| `/brd` | Produce a BRD from the current task | 3 |
| `/epic` | Produce an Epic | 3 |
| `/story` | Produce User Story + AC | 3 |
| `/spec` | Produce Functional Spec | 4 |
| `/design` | Produce Technical Design + diagrams | 5 |
| `/api` | Produce API Contract | 5 |
| `/db` | Produce DB Migration plan | 5 |
| `/risk` | Produce Risk Matrix | 6 |
| `/break` | Produce Task Breakdown + estimates | 7 |
| `/sprint` | Produce Sprint Plan | 8 |
| `/code <area>` | Implement under stated scope | 9 |
| `/unit` | Run unit-test gate | 10 |
| `/test` | Produce / execute QA test plan | 11 |
| `/docs` | Update architecture / ADR / runbook / changelog | 12 |
| `/release` | Produce Release Note + Deployment + Rollback | 13 |
| `/check` | Run production-readiness checklist | 14 |
| `/postdeploy` | Post-release validation report | 15 |
| `/runbook` | Produce / update Runbook | 13 |
| `/adr <title>` | Draft a new ADR | any |
| `/status [TASK-id]` | Print task state | — |
| `/handoff <role>` | Emit handoff note | — |
| `/role <role>` | Switch role explicitly | — |

Any command that depends on missing inputs triggers `/clarify` first.
