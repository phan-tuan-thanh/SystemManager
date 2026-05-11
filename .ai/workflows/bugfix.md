# Workflow: bugfix

1. **Reproduce** with the smallest possible test case; commit it as a failing test.
2. **Root cause** documented in PR description.
3. **Minimal fix** — no opportunistic refactors.
4. **Regression test** — the failing test from step 1 must now pass.
5. **Review + merge**.

## Rules
- NO refactoring while fixing.
- NO architectural changes.
- YES write the failing test first.
- YES add the bug pattern to `known-issues.md` if it could recur elsewhere.
