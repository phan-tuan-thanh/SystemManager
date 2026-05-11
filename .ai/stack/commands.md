# Local commands

> Auto-filled by `scripts/init-workspace.sh` based on detected manifests.
> Verify and edit. Agents must use these exact commands.

| Action            | Command |
|-------------------|---------|
| Install deps      | npm install |
| Build             | npm run build |
| Run unit tests    | npm test |
| Run integration tests | <fill in> |
| Lint              | npm run lint |
| Type-check        | <fill in if applicable> |
| Format            | npm run format |
| Start dev server  | npm run dev |

## Notes
- Do not invent new commands. If something is missing, add it here first.
- Prefer scripted entry points (`make …`, `task …`, npm scripts) over raw tool invocations when the repo has them.
