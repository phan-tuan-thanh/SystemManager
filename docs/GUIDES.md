# Project Development Guides

Unified reference for development workflows, coding standards, and project-specific guides.

---

## 1. Commit & Merge Guidelines
**Reference:** `docs/guides/SPRINT_9_COMMIT_GUIDE.md`

### Standard Commit Format
Follow the conventional commits pattern:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code changes that neither fix a bug nor add a feature
- `docs:` for documentation updates

### Pull Request Workflow
1. Create a descriptive branch (e.g., `feature/topic` or `fix/topic`).
2. Push and use `-o merge_request.create` to trigger GitLab/Git server MR creation.
3. Target branch should always be `main`.

---

## 2. Coding Patterns
**Reference:** `docs/CONVENTIONS.md`

- **Backend**: Modular monolith (one folder per business domain).
- **Frontend**: Page-based organization in `src/pages/`, hooks in `src/hooks/`.
- **Naming**: UpperCamelCase for Components, camelCase for variables/functions, snake_case for Database fields.

---

## 3. Deployment & Environment
**Reference:** `deployment-status.json`

- Backend Swagger: `http://localhost:3000/api/docs`
- Database: PostgreSQL (Port 5432)
- Environment Variables: Controlled via Docker Compose.
