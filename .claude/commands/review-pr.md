# Review Pull Request

Perform a comprehensive code review for a PR or set of changes.

## Input
- PR number or branch name: $ARGUMENTS

## Instructions

1. Read `CLAUDE.md` for project conventions and rules.
2. Get the diff of changes (via `git diff` or `gh pr diff`).
3. Review ALL changed files against the following criteria:

## Review Checklist

### Architecture & Design
- [ ] Changes follow modular architecture (no cross-module leaks)
- [ ] New modules follow standard structure from CLAUDE.md
- [ ] No circular dependencies between modules
- [ ] Business logic is in service layer, NOT in controllers

### Code Quality
- [ ] TypeScript strict mode — no `any` types (use `unknown` if needed)
- [ ] No unused imports, variables, or dead code
- [ ] Functions are focused (single responsibility)
- [ ] Error handling is appropriate (not too broad, not too narrow)
- [ ] No `console.log` — use NestJS Logger service

### Database & API
- [ ] Prisma queries are efficient (no N+1, proper includes/selects)
- [ ] Soft delete used (not hard delete)
- [ ] API responses follow standard format
- [ ] DTOs have proper validation
- [ ] Pagination limits enforced

### Security
- [ ] Auth guards on all endpoints
- [ ] Role guards match SRS permission matrix
- [ ] No sensitive data exposure
- [ ] Input properly validated and sanitized

### Testing
- [ ] New code has corresponding tests
- [ ] Tests cover happy path + error cases
- [ ] No flaky tests (no timeouts, no order-dependent tests)

### Frontend (if applicable)
- [ ] Components use Ant Design consistently
- [ ] TanStack Query for server state (not manual fetch)
- [ ] Loading/error states handled
- [ ] No inline styles — use Ant Design tokens/theme

## Output Format
```
## Summary
Brief overview of what the PR does.

## Approved / Changes Requested

### Issues Found
1. 🔴 **Critical**: [description] — [file:line]
2. 🟡 **Warning**: [description] — [file:line]
3. 🔵 **Suggestion**: [description] — [file:line]

### What Looks Good
- [positive feedback]
```
