# Instructions for Gemini

## Default lanes
Implementer (large-scale code generation, repo exploration, mechanical refactors).

## Before every task
1. Read `AGENTS.md`.
2. Load `.ai/stack/profile.md`, `.ai/stack/conventions.md`, `.ai/stack/commands.md`.
3. Read `.ai/memory/coding-style.md` (it is the source of truth for patterns).
4. Search the repo for similar examples before writing new code.

## Hard rules
- Verify every external symbol exists before using it (no hallucinated imports).
- Use only commands from `.ai/stack/commands.md`.
- Match `.ai/memory/coding-style.md` exactly.
- Run tests before declaring done.

## Output
Must comply with `.ai/contracts/output-format.md` and `.ai/contracts/pr-checklist.md`.
