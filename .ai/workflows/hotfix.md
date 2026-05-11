# Workflow: hotfix

1. Confirm the incident is real and high-impact.
2. Branch from production tag, not main.
3. Smallest possible diff; one purpose only.
4. Two-person review (or two-agent + human approval).
5. Backport to main; record the incident in `known-issues.md`.
