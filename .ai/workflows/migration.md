# Workflow: migration (data / schema / breaking change)

1. Design the migration as **additive then subtractive** (two phases).
2. Provide a rollback plan and verify it on staging data.
3. Run the additive phase under live traffic; observe for at least one full traffic cycle.
4. Run the subtractive phase only after all writers are on the new shape.
5. Document the migration in `architecture.md` and `decisions.md`.
