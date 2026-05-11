# Deployment Plan: <Release>

[Header per `_header.md`]

**Example**: "Sprint 25: Firewall Rules Feature" — Deploy firewall rules CRUD API and UI to DEV → UAT → PROD environments.

## Deployment Targets

| Environment | Order | Deployment Window | Operator | Users | Data Volume | Rollback Time |
|-------------|-------|-------------------|----------|-------|-------------|---------------|
| DEV | 1st | Anytime (dev team working hours preferred) | DevOps or Senior Dev | 5-10 devs | Test data | Immediate |
| UAT | 2nd | 2-3 PM local time (mid-afternoon, low traffic) | DevOps (primary), on-call secondary | 20-30 QAs + stakeholders | Production-like (50k rules) | 5-10 min |
| PROD | 3rd | 2-3 AM local time (off-peak window) | DevOps (primary), on-call secondary | 100+ operators across regions | Live data (10k+ rules) | 10-15 min |

## Pre-Deployment Checklist

### Code & Testing
- [ ] All PRs merged to `main` branch
- [ ] CI green on release tag `v1.2.3` (all tests passing)
- [ ] Code review approved (Architect + Tech Lead signoff)
- [ ] Security review passed (no OWASP Top 10 issues)
- [ ] Test coverage ≥ 80% for new code
- [ ] Integration tests passing on staging database

### Database & Migrations
- [ ] Database migration tested locally
- [ ] Migration tested on UAT database (replica of PROD)
- [ ] Rollback procedure tested and documented
- [ ] `firewall_rules` table schema verified
- [ ] Indexes created and performance validated (< 200ms p95)
- [ ] Soft delete filtering verified in application code

### Configuration & Secrets
- [ ] Feature flag `FEATURE_FIREWALL_RULES` default confirmed (false for staged rollout)
- [ ] Environment variables validated for each environment:
  - DEV: `FIREWALL_ENABLED=true`, `LOG_LEVEL=debug`
  - UAT: `FIREWALL_ENABLED=true`, `LOG_LEVEL=info`
  - PROD: `FIREWALL_ENABLED=false` (until manual toggle), `LOG_LEVEL=info`
- [ ] API rate limits configured in `.env`
- [ ] Database connection strings verified for each environment

### Communication & Monitoring
- [ ] On-call team notified (email + Slack)
- [ ] Operators in Slack #firewall-deploy channel notified
- [ ] Monitoring alerts configured:
  - High error rate (> 5% of requests)
  - API latency spike (p95 > 500ms)
  - Database lock timeouts
  - Audit log failures
- [ ] Runbook link shared in #firewall-deploy
- [ ] Emergency rollback procedures reviewed with on-call

### Approval Sign-off
- [ ] Architect approval ✓
- [ ] Tech Lead approval ✓
- [ ] DevOps approval ✓
- [ ] On-call approval (aware + ready) ✓

## Deployment Steps by Environment

### DEV Deployment

**Window**: Anytime during dev hours  
**Duration**: ~10 minutes  
**Operator**: Senior Dev or DevOps  
**Approval**: Self-service (dev environment)

```
1. git pull origin main
2. docker compose down
3. docker compose up -d --build
   # Applies all migrations automatically
4. npm run db:studio
   # Verify firewall_rules table exists
5. npm test
   # Verify all tests pass with new schema
6. curl http://localhost:3000/api/v1/firewall-rules
   # Should return 200 (empty list)
7. Create test rule via Swagger (http://localhost:3000/api/docs)
8. Verify rule appears in list
9. Test soft delete (DELETE rule, verify deleted_at set)
10. Verify audit log entry for all changes
✓ DEV deployment complete
```

### UAT Deployment

**Window**: 2-3 PM local time (low traffic, QA available)  
**Duration**: ~20 minutes (includes pre/post-deployment checks)  
**Operator**: DevOps (primary)  
**Approval**: QA + on-call awareness

```
1. [5 min prep] Notify in Slack #firewall-deploy: "Starting UAT deploy, ETA 20 min"

2. [5 min deploy]
   - SSH to UAT environment
   - git fetch && git checkout v1.2.3
   - docker compose pull
   - docker compose up -d --build --remove-orphans
   - npx prisma migrate deploy --environment=uat
     # Applies any pending migrations

3. [5 min verification]
   - Verify container health: docker compose ps
     # All containers should show "healthy" or "up"
   - Verify app started: curl -I http://uat-api:3000/api/v1/health
     # Should return 200 OK
   - Check logs for errors: docker compose logs backend | grep -i error
   - Verify database: psql -c "SELECT COUNT(*) FROM firewall_rules;"
     # Should be 0 (new table)

4. [5 min smoke tests]
   - Create rule via Swagger (http://uat-api:3000/api/docs)
   - List rules: GET /api/v1/firewall-rules
   - Update rule: PATCH /api/v1/firewall-rules/{id}
   - Delete rule: DELETE /api/v1/firewall-rules/{id}
   - Verify audit log: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
   - Test role-based access:
     * Login as "operator" user → can create/delete rules ✓
     * Login as "viewer" user → cannot create rules (403 error) ✓

5. [2 min post-deploy]
   - Notify Slack: "UAT deployment successful, QA testing enabled"
   - QA begins testing user journeys on UAT
   - Monitor metrics in Grafana (firewall rules latency, error rate)

✓ UAT deployment complete, ready for PROD
```

### PROD Deployment

**Window**: 2-3 AM local time (off-peak, lowest traffic)  
**Duration**: ~30 minutes (includes pre/post checks + monitoring)  
**Operator**: DevOps (primary) + on-call (secondary standby)  
**Approval**: Tech Lead + DevOps explicit sign-off

```
1. [10 min pre-deploy]
   - Create Incident ticket in Linear (for traceability)
   - Notify on-call: Slack message with runbook link
   - Check current PROD metrics (baseline):
     * API latency p95 < 100ms
     * Error rate < 0.5%
     * Database connections: 20/100 (healthy)
   - Verify rollback plan accessible in case of emergency

2. [5 min deploy]
   - SSH to PROD primary server
   - git fetch && git checkout v1.2.3
   - docker compose pull  # Downloads new images
   - docker compose up -d --build --remove-orphans  # Zero-downtime restart
   - npx prisma migrate deploy  # Applies database migration (should be < 1 sec)

3. [5 min app verification]
   - Health check: curl https://api.prod.system.local/api/v1/health
     # Should return 200 immediately
   - Check logs: docker compose logs backend | tail -20 | grep -i error
     # Should be zero errors
   - Verify database connection pool healthy
   - Query firewall rules table: SELECT COUNT(*) FROM firewall_rules WHERE deleted_at IS NULL;
     # Should return 0 (new table, no migration data)

4. [5 min smoke tests]
   - Create test rule via PROD API (low traffic, won't affect operators)
   - List rules, update, delete to verify all endpoints respond
   - Check audit logs: SELECT * FROM audit_logs WHERE resource_type='firewall_rule' ORDER BY created_at DESC;
   - Verify role-based access works (operator can create, viewer cannot)

5. [5 min enable feature]
   - Set feature flag: FEATURE_FIREWALL_RULES = true (via environment variable or config service)
   - OR: Restart containers with new env var
   - Verify flag is active: GET /api/v1/flags/firewall-rules → enabled: true

6. [1 min monitoring]
   - Watch Grafana dashboard (firewall-rules metrics)
   - Monitor error rate chart (should be < 0.5%)
   - Monitor API latency (p95 should stay < 200ms)
   - Set alert thresholds for 30 min observation window

7. [After deployment]
   - Notify Slack #firewall-deploy: "PROD deployment successful ✓, feature enabled for 10% of operators"
   - Update runbook with any issues encountered
   - on-call can stand down after 30 min stable observation
   - Close Linear incident if all clear

✓ PROD deployment complete
```

## Configuration & Environment Variables

| Key | DEV | UAT | PROD | Notes |
|-----|-----|-----|------|-------|
| `FIREWALL_ENABLED` | `true` | `true` | `false` | Feature flag (enable after testing) |
| `FIREWALL_RATE_LIMIT` | `100/min` | `100/min` | `100/min` | Per-user rate limit |
| `DB_HOST` | `localhost` | `uat-db.internal` | `prod-db.internal` | Database server |
| `DB_NAME` | `system_dev` | `system_uat` | `system_prod` | Database name |
| `LOG_LEVEL` | `debug` | `info` | `info` | Logging verbosity |
| `HONEYCOMB_API_KEY` | Test token | Prod token | Prod token | Distributed tracing |
| `SENTRY_DSN` | Dev DSN | Prod DSN | Prod DSN | Error tracking |

## Post-Deployment Smoke Tests

**Run immediately after deployment (before notifying operators)**:

```bash
#!/bin/bash
set -e

echo "Running smoke tests..."

BASE_URL="${1:-http://localhost:3000}"
AUTH_TOKEN="${2:-<operator_jwt_token>}"

# Test 1: API is healthy
echo "✓ Testing /health endpoint..."
curl -f "$BASE_URL/api/v1/health" || exit 1

# Test 2: Create rule
echo "✓ Creating test firewall rule..."
RULE_ID=$(curl -s -X POST "$BASE_URL/api/v1/firewall-rules" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke-test","port":9999,"protocol":"tcp","environment":"PROD"}' \
  | jq -r '.id')

[ -z "$RULE_ID" ] && exit 1
echo "  Created rule: $RULE_ID"

# Test 3: List rules (should include test rule)
echo "✓ Listing rules..."
curl -s -X GET "$BASE_URL/api/v1/firewall-rules?environment=PROD" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.data | length' || exit 1

# Test 4: Get single rule
echo "✓ Getting single rule..."
curl -f -s -X GET "$BASE_URL/api/v1/firewall-rules/$RULE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" || exit 1

# Test 5: Update rule
echo "✓ Updating rule..."
curl -f -s -X PATCH "$BASE_URL/api/v1/firewall-rules/$RULE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"port":9998}' || exit 1

# Test 6: Delete rule (soft delete)
echo "✓ Deleting rule..."
curl -f -s -X DELETE "$BASE_URL/api/v1/firewall-rules/$RULE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" || exit 1

# Test 7: Verify soft delete (should not appear in list)
echo "✓ Verifying soft delete..."
curl -s -X GET "$BASE_URL/api/v1/firewall-rules?environment=PROD" \
  -H "Authorization: Bearer $AUTH_TOKEN" | grep -q "$RULE_ID" && echo "ERROR: Deleted rule still visible!" && exit 1

echo "✅ All smoke tests passed!"
```

## Rollback Procedure

See `.ai/contracts/artifacts/rollback-plan.md` for complete rollback instructions.

**Quick rollback** (if critical issues):
```bash
# Immediate: Disable feature flag
docker compose exec backend bash -c "export FIREWALL_ENABLED=false && kill 1"
# App restarts with feature disabled, rules hidden from operators

# If needed: Full rollback to previous version
docker compose down
git checkout v1.2.2  # Previous stable version
docker compose up -d --build
npx prisma migrate resolve --rolled-back add_firewall_rules
# App reverts to previous code, firewall_rules table dropped (but data retained via soft delete)
```

**Rollback time**: < 5 minutes for quick disable, < 15 minutes for full version rollback

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| Database migration fails | Low | App can't start | Migration tested on staging replica (UAT) first |
| Port conflict undetected | Low | Rules create bad state | Port validation in DTO + DB constraint + topology integration |
| Audit log misses changes | Medium | Compliance violation | Transaction ensures mutation + audit insert atomic |
| Feature flag not disabled in PROD | Medium | Unintended feature exposure | Feature flag default: false (requires explicit enable) |
| Operators can't create rules due to role check | Low | Feature unusable | Role-based access tested in UAT before PROD |
| Scaling issue (slow list query with many rules) | Low | Performance degrades | Index on (environment, deleted_at), latency target < 200ms p95 |
| Rollback fails due to schema state | Low | Can't revert | Rollback procedure tested on staging; schema change is additive (safe) |

## Observability During Deploy

**Grafana Dashboard**: `https://grafana.prod/d/firewall-rules`

Monitor for 30 minutes post-deployment:
- **API latency**: p95 < 200ms (alert if > 500ms for 5 min)
- **Error rate**: < 0.5% (alert if > 1% for 5 min)
- **Database latency**: p95 < 100ms (alert if > 300ms)
- **Active connections**: Should be stable (no leak)

**Alert channels**: Slack #firewall-alerts, PagerDuty on-call

## Tests / Validation

- [ ] Deployment dry-run on staging on 2026-05-10
  - Full DEV → UAT → PROD deployment simulation completed
  - Rollback tested and verified functional
  - Smoke tests executed and passed
  - Monitoring dashboards validated

- [ ] Final checklist before PROD deploy:
  - [ ] Feature flag defaults reviewed
  - [ ] On-call team confirmed ready
  - [ ] Runbook link shared and accessible
  - [ ] Communication plan ready (Slack notifications)
  - [ ] Previous version tag confirmed stable

## Next steps

1. **DevOps** (`.ai/agents/devops.md`):
   - Execute deployment stages (DEV → UAT → PROD)
   - Run smoke tests after each stage
   - Monitor metrics for 30 min post-PROD deploy
   - Update runbook with any issues
   - Coordinate with on-call for PROD window

2. **Tech Lead** (`.ai/agents/tech-lead.md`):
   - Monitor PROD deploy, be on standby for issues
   - Coordinate rollback if critical issues occur
   - Update team with deployment status

3. **QA** (`.ai/agents/qa.md`):
   - Test on UAT immediately after deployment
   - User journey testing (create → list → update → delete)
   - Regression testing on existing firewall functionality
   - Sign-off for PROD deployment approval
