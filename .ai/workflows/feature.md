# Workflow: feature

1. **Planner** reads scope + relevant ADRs, writes plan, lists files in scope.
2. **Architect** designs API/data/integration; writes design doc; updates `architecture.md`.
3. **Implementer** codes against design + writes tests to coverage threshold.
4. **Reviewer** validates against contracts and runs `stack/commands.md` build/test.
5. **Merge**: squash to main; mark task merged in `active-tasks.md`.

## Success criteria
- ✓ Every output complies with `contracts/output-format.md`.
- ✓ Coverage threshold met.
- ✓ Memory updated.
