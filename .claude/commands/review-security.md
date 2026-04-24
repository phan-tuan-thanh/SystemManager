# Security Review

Perform a security audit on recent changes or specified files.

## Input
- Target: $ARGUMENTS (file path, module name, or "all" for full scan)

## Instructions

Review the specified code for security vulnerabilities. Check for ALL of the following:

### Authentication & Authorization
- [ ] All endpoints have `@UseGuards(AuthGuard)` (or `@Public()` with justification)
- [ ] Role-based access uses `@Roles()` decorator matching SRS permission matrix
- [ ] Module guard `@RequireModule()` applied where needed
- [ ] JWT tokens have proper expiry (access: 15min, refresh: 7 days)
- [ ] Refresh token rotation is implemented (old token invalidated after use)

### Input Validation
- [ ] All DTOs use class-validator decorators
- [ ] String inputs are trimmed and length-limited
- [ ] No HTML/script injection possible (sanitize user input)
- [ ] File uploads validate MIME type AND extension (not just extension)
- [ ] File size limits enforced (max 20MB)
- [ ] Only allowed file types: .pdf, .docx, .xlsx

### Data Protection
- [ ] Passwords hashed with bcrypt (salt rounds >= 12)
- [ ] No passwords, tokens, or secrets in API responses
- [ ] No sensitive data in audit log old_value/new_value
- [ ] No secrets in error messages or logs
- [ ] `.env` files in `.gitignore`

### SQL / Database
- [ ] No raw SQL queries (use Prisma exclusively)
- [ ] No string concatenation in queries
- [ ] Soft delete used (no hard deletes of user data)
- [ ] Queries filter by `deleted_at IS NULL` by default

### API Security
- [ ] Rate limiting on auth endpoints (login, refresh, password reset)
- [ ] CORS configured properly (not wildcard in production)
- [ ] No sensitive data in URL query parameters
- [ ] Pagination limits enforced (max 100 items per page)
- [ ] No mass assignment — DTOs whitelist allowed fields

### Frontend Security
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No sensitive data in localStorage (use httpOnly cookies for tokens if possible)
- [ ] No secrets or API keys in frontend code
- [ ] User input escaped before rendering

### Common Vulnerabilities (OWASP Top 10)
- [ ] Injection (SQL, NoSQL, Command, LDAP)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure
- [ ] Broken Access Control
- [ ] Security Misconfiguration
- [ ] XSS (Cross-Site Scripting)
- [ ] Insecure Deserialization
- [ ] Using Components with Known Vulnerabilities
- [ ] Insufficient Logging & Monitoring

## Output
Provide a structured report:
1. **Critical** — must fix before merge
2. **Warning** — should fix soon
3. **Info** — best practice suggestions
