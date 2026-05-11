# Workflow: release

1. Confirm `active-tasks.md` has no in-flight tasks blocking the release.
2. Generate release notes from merged PR titles.
3. Bump version per `commit-policy.md`.
4. Tag, build, deploy per `stack/commands.md` and the project's deploy doc.
5. Smoke-test in production / production-equivalent.
