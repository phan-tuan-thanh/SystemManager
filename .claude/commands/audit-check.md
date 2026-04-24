# Audit Log Compliance Check

Verify that all mutating operations are properly captured in the audit log system.

## Input
- Module name or "all": $ARGUMENTS

## Instructions

1. Read `CLAUDE.md` and `docs/SRS.md` section 4.6 for audit log requirements.
2. Scan the specified module(s) for compliance.

## Checks

### Every Controller/Resolver with mutating endpoints MUST:
- [ ] Be intercepted by `AuditLogInterceptor` (global or per-controller)
- [ ] Not bypass audit logging (no custom routes that skip the interceptor)

### AuditLogInterceptor MUST capture:
- [ ] `userId` — from JWT token
- [ ] `action` — CREATE / UPDATE / DELETE (derived from HTTP method)
- [ ] `resourceType` — from controller metadata or route
- [ ] `resourceId` — from route params
- [ ] `oldValue` — fetched BEFORE mutation (for UPDATE and DELETE)
- [ ] `newValue` — result AFTER mutation (for CREATE and UPDATE)
- [ ] `ipAddress` — from request
- [ ] `userAgent` — from request headers
- [ ] `result` — SUCCESS / FAILED / FORBIDDEN

### Sensitive Data MUST be excluded from audit values:
- [ ] password / passwordHash
- [ ] JWT tokens (access, refresh)
- [ ] API keys / secrets
- [ ] Microsoft 365 client secret

### Additional Requirements:
- [ ] Failed operations (400, 403, 404) also logged with `result: FAILED`
- [ ] Bulk operations log each individual change
- [ ] Module enable/disable actions are logged
- [ ] User login/logout events are logged
- [ ] File upload/delete events are logged

## Output
Report compliance status per module:
- ✅ Module fully compliant
- ⚠️  Module partially compliant — [details]
- ❌ Module non-compliant — [missing audit coverage]
