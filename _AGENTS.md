# SystemManager — Kilo Agent Instructions

This project uses Kilo CLI with custom commands. All commands are in `.kilo/command/*.md`.

## Available Commands

| Command                       | Description                        |
| ----------------------------- | ---------------------------------- |
| `/add-feature <description>`  | **Full pipeline**: docs → tasks → branch → implement → test → fix → report → push |
| `/build-sprint <N>`           | Implement all tasks for a sprint   |
| `/new-module <name>`          | Scaffold new NestJS backend module |
| `/gen-migration <desc>`       | Generate Prisma database migration |
| `/new-page <name>`            | Scaffold new React frontend page   |
| `/gen-test <target>`          | Generate unit/integration tests    |
| `/check-module-deps [module]` | Verify module dependency integrity |
| `/init-project`               | Bootstrap full project structure   |
| `/review-pr <pr>`             | Code review for pull request       |
| `/review-security <target>`   | Security audit                     |
| `/audit-check [module]`       | Audit log compliance check         |
| `/update-docs <description>`  | **Sync docs**: SRS, tasks, progress, status |
| `/add-demo-ui <description>`  | **Design UI**: Create/update UI mockups for sprint |

## Usage

Invoke commands by typing `/command-name` or `/command-name arg` in Kilo CLI.

Example:

- `/new-module server` - creates server module
- `/gen-migration add servers table` - creates migration
- `/new-page server` - creates frontend page
- `/check-module-deps all` - validates all dependencies

## Project Context

Read `CLAUDE.md` and `docs/SRS.md` before working on any module.

## Key Conventions

- Backend modules: `packages/backend/src/modules/<name>/`
- Frontend pages: `packages/frontend/src/pages/<name>/`
- Always use soft delete (set deleted_at, never hard delete)
- All endpoints require auth + role + module guard
- Follow naming conventions from CLAUDE.md

## Project Status

Check `deployment-status.json` for current project status. This file is updated by agents to track progress and is shared across all AI agents for consistency.

## Current Status Summary

- **Overall**: IN PROGRESS - Phase 1 (Core Modules)
- **Completion**: ~35%
- **Backend**: 5/16 modules implemented (auth, user, module-config, audit, system)
- **Frontend**: 3/13 pages implemented (auth/login, dashboard, setup)
- **Database**: Schema defined (20 models) but no migrations run yet
- **Next**: Guards, decorators, interceptors, then remaining modules
