# API Contract: <Title>

[Header per `_header.md`]

**Example**: "Firewall Rules CRUD API" — REST endpoints for creating, reading, updating, and deleting firewall rules with full audit trail.

## Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/v1/firewall-rules` | List rules (filtered by environment) | Required: `firewall:read` |
| GET | `/api/v1/firewall-rules/:id` | Get single rule | Required: `firewall:read` |
| POST | `/api/v1/firewall-rules` | Create rule | Required: `firewall:write` |
| PATCH | `/api/v1/firewall-rules/:id` | Update rule | Required: `firewall:write` |
| DELETE | `/api/v1/firewall-rules/:id` | Soft delete rule | Required: `firewall:write` |

## Versioning

- **Version**: v1 (initial version)
- **Deprecation policy**: Endpoints deprecated with ≥3 months notice, new major version for breaking changes
- **Compatibility**: Backwards-compatible — all changes are additive (new fields, not field removal or type change)
- **API maturity**: Stable for Phase 4 (UX Polish & Maintenance)

## Request / Response Examples

### GET /api/v1/firewall-rules

**Request**:
```bash
curl -X GET "http://localhost:3000/api/v1/firewall-rules?environment=PROD&skip=0&take=20" \
  -H "Authorization: Bearer <jwt_token>"
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "allow-ssh",
      "port": 22,
      "protocol": "tcp",
      "environment": "PROD",
      "createdAt": "2026-05-11T10:00:00Z",
      "updatedAt": "2026-05-11T10:00:00Z",
      "createdBy": {
        "id": "user-uuid",
        "email": "operator@system.local"
      }
    }
  ],
  "total": 42,
  "skip": 0,
  "take": 20
}
```

### POST /api/v1/firewall-rules

**Request**:
```bash
curl -X POST "http://localhost:3000/api/v1/firewall-rules" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "allow-https",
    "port": 443,
    "protocol": "tcp",
    "environment": "PROD"
  }'
```

**Response** (201 Created):
```json
{
  "id": "uuid-new",
  "name": "allow-https",
  "port": 443,
  "protocol": "tcp",
  "environment": "PROD",
  "createdAt": "2026-05-11T10:30:00Z",
  "updatedAt": "2026-05-11T10:30:00Z",
  "createdBy": {
    "id": "user-uuid",
    "email": "operator@system.local"
  }
}
```

### PATCH /api/v1/firewall-rules/:id

**Request**:
```bash
curl -X PATCH "http://localhost:3000/api/v1/firewall-rules/uuid-1" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "allow-ssh-updated",
    "port": 2222
  }'
```

**Response** (200 OK):
```json
{
  "id": "uuid-1",
  "name": "allow-ssh-updated",
  "port": 2222,
  "protocol": "tcp",
  "environment": "PROD",
  "createdAt": "2026-05-11T10:00:00Z",
  "updatedAt": "2026-05-11T10:35:00Z",
  "createdBy": {
    "id": "user-uuid",
    "email": "operator@system.local"
  }
}
```

### DELETE /api/v1/firewall-rules/:id

**Request**:
```bash
curl -X DELETE "http://localhost:3000/api/v1/firewall-rules/uuid-1" \
  -H "Authorization: Bearer <jwt_token>"
```

**Response** (204 No Content):
```
(empty body)
```

## Request Schema (DTO)

### CreateFirewallRuleDto
```typescript
{
  "name": "string (1-255 chars, required) — human-readable rule name",
  "port": "integer (1-65535, required) — TCP/UDP port number",
  "protocol": "enum ('tcp' | 'udp', required) — transport layer protocol",
  "environment": "enum ('DEV' | 'UAT' | 'PROD', required) — target environment"
}
```

### UpdateFirewallRuleDto
```typescript
{
  "name": "string (optional) — new rule name",
  "port": "integer (optional) — new port",
  "protocol": "enum (optional) — new protocol",
  "environment": "enum (optional) — new environment"
}
```

### FirewallRuleResponseDto
```typescript
{
  "id": "string (UUID) — unique rule identifier",
  "name": "string — rule name",
  "port": "integer — port number",
  "protocol": "enum — protocol",
  "environment": "enum — environment",
  "createdAt": "ISO 8601 datetime — creation timestamp",
  "updatedAt": "ISO 8601 datetime — last update timestamp",
  "createdBy": {
    "id": "string (UUID) — user ID",
    "email": "string — user email"
  }
}
```

## Response Status Codes

| Status | Meaning | Condition |
|--------|---------|-----------|
| **200 OK** | Successful GET, PATCH | Request succeeded, response body contains result |
| **201 Created** | Successful POST | Rule created, response body contains new rule data |
| **204 No Content** | Successful DELETE | Rule soft-deleted, no response body |
| **400 Bad Request** | Input validation failed | Invalid port, missing required field, invalid enum value |
| **401 Unauthorized** | Missing or invalid auth token | No Authorization header or token expired |
| **403 Forbidden** | Insufficient permissions | User lacks `firewall:read` or `firewall:write` role |
| **404 Not Found** | Rule does not exist | GET/PATCH/DELETE for non-existent rule ID |
| **409 Conflict** | Port already in use | Another rule exists for same port in same environment |
| **500 Internal Server Error** | Server error | Unexpected exception (logged, alert on-call) |

## Error Response Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message": "string — human-readable error message",
  "error": "string — error code (INVALID_PORT, PORT_IN_USE, etc.)",
  "details": {
    "field": ["error message 1", "error message 2"]
  },
  "timestamp": "2026-05-11T10:45:00.000Z",
  "path": "/api/v1/firewall-rules"
}
```

## Error Codes

| Code | Status | Meaning | Retryable |
|------|--------|---------|-----------|
| INVALID_PORT | 400 | Port outside 1-65535 range | No |
| INVALID_PROTOCOL | 400 | Protocol not in ('tcp', 'udp') | No |
| INVALID_ENVIRONMENT | 400 | Environment not in ('DEV', 'UAT', 'PROD') | No |
| MISSING_FIELD | 400 | Required field missing (name, port, etc.) | No |
| PORT_IN_USE | 409 | Rule with same port + environment exists | No |
| RULE_NOT_FOUND | 404 | Rule ID doesn't exist | No |
| UNAUTHORIZED | 401 | Missing or invalid auth token | Yes (retry after refresh) |
| FORBIDDEN | 403 | User lacks required role | No |
| SERVER_ERROR | 500 | Internal server error (logged) | Yes (retry with backoff) |

## Idempotency

- **Idempotent operations**: GET, DELETE (idempotent by definition)
- **Non-idempotent operations**: POST (creates new rule each time), PATCH (updates state)
- **Optional header**: `Idempotency-Key` (UUID) for POST requests (optional, enables deduplication)
- **Dedup window**: 24 hours (if same Idempotency-Key within 24h, return cached response)

**Example**:
```bash
curl -X POST "http://localhost:3000/api/v1/firewall-rules" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "allow-ssh", "port": 22, ...}'
# If retried with same Idempotency-Key, returns same rule ID (deduplicated)
```

## Rate Limits

- **Per-user rate limit**: 100 requests per minute (all endpoints combined)
- **Per-endpoint limit**: 
  - POST (create): 10 per minute
  - PATCH (update): 10 per minute
  - DELETE: 5 per minute
  - GET: 60 per minute
- **Rate limit headers**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1683900360
  ```

**Error response (429 Too Many Requests)**:
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "error": "RATE_LIMIT",
  "retryAfter": 10
}
```

## Authentication & Authorization

### Authentication (AuthN)
- **Method**: Bearer token (JWT)
- **Header**: `Authorization: Bearer <jwt_token>`
- **Token validation**: Signature verified by NestJS auth middleware
- **Token expiry**: 24 hours (refresh token available separately)

### Authorization (AuthZ)
- **Role-based access control (RBAC)**:
  - `firewall:read` — required for GET endpoints
  - `firewall:write` — required for POST, PATCH, DELETE endpoints
  - `admin` — bypasses all checks (can read/write all rules)
- **Environment isolation**: Users can only access rules in their assigned environments (via context)

**Example**:
```typescript
@Controller('firewall-rules')
export class FirewallRulesController {
  @Post()
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('firewall:write')
  create(@Body() dto: CreateFirewallRuleDto) { ... }
}
```

## Observability

### Metrics
- `firewall_rule_created_total` (counter) — rules created
- `firewall_rule_updated_total` (counter) — rules updated
- `firewall_rule_deleted_total` (counter) — rules soft-deleted
- `firewall_rule_list_duration_ms` (histogram) — list query latency
- `firewall_rule_port_conflict_total` (counter) — conflict detection hits

### Audit Trail
- **Every mutation logged** to `audit_logs` table:
  - `action`: 'create' | 'update' | 'delete'
  - `resource_type`: 'firewall_rule'
  - `resource_id`: rule UUID
  - `operator_id`: authenticated user ID
  - `changes`: before/after values
  - `timestamp`: when change occurred

### Distributed Tracing
- **Span name**: `firewall-rule.create` | `firewall-rule.update` | `firewall-rule.delete`
- **Trace propagation**: Via `X-Trace-ID` header (optional)

## Risks

| Risk | Mitigation |
|------|-----------|
| Port validation bypass | DTO validation (class-validator) + database CHECK constraint |
| Conflict detection race condition | Unique constraint (name, environment) in database prevents duplicates |
| Unauthorized access | JWT token signature verified, role check in middleware |
| Audit log missing | Transaction: mutation + audit insert atomic, fail entire operation if audit fails |
| API not following contract | Contract tests in integration suite verify request/response shape |

## Tests / Validation

- [ ] **Contract tests**: Fixed test fixtures committed under `tests/fixtures/firewall-rules/`
  - `create-valid.json` — valid create request
  - `create-invalid-port.json` — invalid port request
  - `create-conflict.json` — duplicate port request
  - `response-success.json` — expected success response shape

- [ ] **Integration tests**: Test actual endpoints with test database
  - Test all 5 endpoints with valid inputs
  - Test all error codes (400, 401, 403, 404, 409, 500)
  - Test role-based access (operator can create, viewer cannot)
  - Test environment isolation (DEV rules don't conflict with PROD)

- [ ] **API documentation**: Swagger/OpenAPI spec generated from NestJS decorators
  - Run: `npm run gen-api-docs` → `docs/api/firewall-rules.yaml`

- [ ] **Load testing**: Verify latency targets
  - Create 100 rules in sequence → measure p95 latency < 200ms

## Next steps

1. **Architect** (`.ai/agents/architect.md`):
   - Review API design (endpoint paths, error codes, auth model)
   - Verify consistency with existing APIs (see `.ai/memory/integration-map.md`)
   - Approve contract before implementation

2. **Senior Dev** (`.ai/agents/senior-dev.md`):
   - Implement controller + service against this contract
   - Generate Swagger docs: `npm run gen-api-docs`
   - Write integration tests for all endpoints and error cases
   - Verify contract tests pass

3. **QA** (`.ai/agents/qa.md`):
   - Create E2E test scenarios based on contract
   - Manual testing on staging (test all error paths)
   - Performance testing (measure latency targets)
   - Cross-browser testing of API calls from frontend
