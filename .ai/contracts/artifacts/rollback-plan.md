# Rollback Plan: <Release>

[Header per `_header.md`]

**Example**: "Sprint 25: Firewall Rules" — Rollback procedure for reverting firewall rules feature if critical issues occur in production.

## Trigger Conditions (When to Rollback)

**Automatic triggers** (on-call should initiate rollback immediately):
- API error rate > 5% for 2+ minutes
- API latency p95 > 1 second for 2+ minutes
- Database connection pool exhausted (0 available connections)
- Audit log failures (mutations not logged)
- Critical security vulnerability discovered
- Data corruption detected

**Manual triggers** (on-call + Tech Lead decision):
- Unexpected data state (rules missing, corrupted)
- Operator complaints of widespread failures
- On-call feels uncertain about stability

**NOT triggers** (can tolerate / monitor closely):
- Single API request failure (normal)
- Brief latency spike < 2 min (likely temporary load)
- Rate limit hit (expected when traffic spikes)
- Minor validation error in specific cases

## Quick Rollback (Feature Flag Disable)

**Time: ~2 minutes**  
**Data preserved**: Yes (no database changes)  
**Use when**: API is responding but new feature has bugs

```bash
# SSH to PROD primary
ssh devops@prod-api.internal

# Disable feature flag
docker compose exec backend bash -c "
  export FIREWALL_ENABLED=false
  kill -TERM 1  # Graceful restart
"

# Verify app restarted
docker compose logs backend | tail -20 | grep -i "started\|error"

# Test health
curl https://api.prod.system.local/api/v1/health

# Verify firewall endpoints return 503 or feature disabled
curl https://api.prod.system.local/api/v1/firewall-rules \
  -H "Authorization: Bearer <token>" \
  # Should return error: "Feature firewall_rules disabled"

# Notify Slack
slack-notify "#firewall-deploy" "🔄 Firewall feature disabled via flag, app stable"
```

**Rollback decision point**: Stop here if stability verified. If not, proceed to full version rollback.

## Full Rollback (Version Revert)

**Time: ~10-15 minutes**  
**Data impact**: Schema change reverted (firewall_rules table dropped, data retained in soft-delete rows)  
**Use when**: Feature flag disable insufficient, need to revert code

```bash
# 1. [1 min] Prepare rollback
ssh devops@prod-api.internal

# Verify previous stable version
git tag | grep v1  # Should see: v1.2.2, v1.2.1 (current: v1.2.3 with bug)

# 2. [2 min] Revert code
docker compose down  # Stop all containers
git fetch origin
git checkout v1.2.2  # Previous stable version
git log --oneline | head -5  # Verify correct version

# 3. [3 min] Rollback database migration (if needed)
# Only needed if migration caused issues; skip if schema change is safe backward
docker compose exec postgres bash -c "
  psql -U postgres -d system_prod -c \"
    SELECT * FROM '_prisma_migrations' ORDER BY finished_at DESC LIMIT 3;
  \"
"
# Note the migration ID for firewall_rules (e.g., 20260511_add_firewall_rules)

# Resolve as rolled back (tells Prisma to ignore this migration)
npx prisma migrate resolve --rolled-back 20260511_add_firewall_rules

# Alternative: Manual SQL rollback (if Prisma fails)
# docker compose exec postgres bash -c "DROP TABLE IF EXISTS firewall_rules CASCADE;"

# 4. [3 min] Start previous version
docker compose up -d --build  # Starts v1.2.2
npx prisma migrate deploy  # Applies migrations for v1.2.2 (should be no-op)

# 5. [2 min] Verify health
docker compose ps  # All containers should show "healthy" or "up"
curl -f https://api.prod.system.local/api/v1/health || exit 1
docker compose logs backend | tail -20 | grep -i error  # Should be no errors

# 6. [1 min] Smoke tests
curl https://api.prod.system.local/api/v1/servers  # Test existing feature
# Should return 200 (unaffected by rollback)

# 7. Communication
slack-notify "#firewall-deploy" "🔄 Rolled back to v1.2.2, firewall feature removed, app stable"
slack-notify "#incidents" "🚨 Incident #INC-123: Firewall feature v1.2.3 rolled back due to [REASON]"
```

**Post-rollback actions**:
```bash
# On-call review
# 1. Check rollback completed successfully
# 2. Monitor metrics for 5 min (should be back to baseline)
# 3. Notify team in #incidents of root cause analysis start
# 4. Create postmortem ticket in Linear
```

## Gradual Rollback (If Partial Deployment)

**If only deployed to 10% of operators** (canary deployment):

```bash
# Reduce feature flag to 5% of users (vs. 10%)
docker compose exec backend bash -c "
  export FIREWALL_FEATURE_PERCENT=5
  kill -TERM 1
"

# Monitor metrics for 5 min
# If error rate improves: problem is feature code, not infrastructure
#   → Proceed to full rollback
# If error rate unchanged: problem is elsewhere
#   → Stop rollback, investigate further
```

## Time Budget

- **Target RTO** (Recovery Time Objective): < 15 minutes from "rollback decision" to "app healthy and serving traffic"
- **Last measured on staging**: 12 minutes (2026-05-10 rehearsal)
  - Code revert: 2 min
  - Database rollback: 3 min (wait for migration to finish)
  - App health check: 2 min
  - Smoke tests: 3 min
  - Verification: 2 min

**If rollback exceeds 20 min**:
- Abort rollback, contact infrastructure team
- Consider switching to failover DB (if available)

## Data Divergence After Rollback

### Data created during bad window (v1.2.3 deployment)

**Firewall rules created between deployment and rollback**:
- Example: Operators created 5 firewall rules during the 12-minute rollback window
- **What happens**: 
  - Rules are in `firewall_rules` table (v1.2.3 added this table)
  - After rollback to v1.2.2, `firewall_rules` table still exists (DROP TABLE is in rollback SQL, but Prisma migration resolve doesn't execute it automatically)
  - Actually: Prisma `migrate resolve --rolled-back` just marks migration as rolled back in `_prisma_migrations`; it doesn't execute rollback SQL
  - **Manual fix needed**: 
    ```bash
    docker compose exec postgres bash -c "
      psql -U postgres -d system_prod -c \"DROP TABLE IF EXISTS firewall_rules CASCADE;\"
    "
    ```

### How to handle orphaned data

**Option 1: Manual cleanup** (recommended)
- After rollback confirms stable, manually drop firewall_rules table
- Note: Soft-deleted data is retained; only schema reverts
- No data loss for operators (rules just become inaccessible)

**Option 2: Leave table (if planning quick re-deploy)**
- If firewall feature will be re-deployed within 24 hours, leave table intact
- Saves time if rolling back temporarily for other fixes

**Option 3: Archive and cleanup** (for forensics)
- Before rolling back, export firewall_rules data:
  ```bash
  docker compose exec postgres bash -c "
    pg_dump -U postgres -d system_prod -t firewall_rules > /backups/firewall_rules_20260511_1230.sql
  "
  ```
- Archive file for root cause analysis
- Then drop table after investigation

### User-facing impact

**Operators**:
- Firewall rules page becomes unavailable (404 or feature hidden)
- Any rules created during the window are lost (not accessible, table dropped)
- NO data in other modules is affected (servers, deployments, topology unaffected)

**Root cause analysis**:
- Query `audit_logs` for all firewall rule changes made during bad window:
  ```sql
  SELECT * FROM audit_logs 
  WHERE resource_type = 'firewall_rule' 
  AND created_at BETWEEN '2026-05-11 02:00:00' AND '2026-05-11 02:15:00'
  ORDER BY created_at DESC;
  ```
- Contact operators to re-create rules if needed

## Verification Checklist

After rollback, verify in this order:

```bash
# 1. Application health (immediate)
curl -v https://api.prod.system.local/api/v1/health
# Should return 200 OK within 1 second

# 2. Core modules stable (unrelated to firewall)
curl -v https://api.prod.system.local/api/v1/servers?limit=5 -H "Authorization: Bearer $TOKEN"
# Should return 200, sample of servers

curl -v https://api.prod.system.local/api/v1/deployments?limit=5 -H "Authorization: Bearer $TOKEN"
# Should return 200, sample of deployments

# 3. Database connectivity
docker compose exec postgres bash -c "psql -U postgres -d system_prod -c \"SELECT 1;\""
# Should return 1

# 4. Feature hidden (firewall rules removed)
curl -v https://api.prod.system.local/api/v1/firewall-rules -H "Authorization: Bearer $TOKEN"
# Should return 404 or error "Feature not available in v1.2.2"

# 5. Metrics within baseline (check Grafana)
# - API latency p95: back to < 100ms
# - Error rate: back to < 0.5%
# - Database connections: normal (~20-30 used)
# If any metric still elevated, don't declare victory yet

# 6. On-call sign-off
# On-call reviews all above checks and confirms:
# - "✓ Health check green"
# - "✓ Metrics back to baseline"
# - "✓ Rolled back successfully"
```

## Risks During Rollback

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Rollback takes > 20 min | Extended downtime | Practice rollback on staging; have runbook ready |
| Database connectivity lost during migrate | Can't revert schema | Use `--skip-generate` flag to skip Prisma client regen |
| Application won't start after rollback | Still broken | Have v1.2.1 tag ready as fallback; can roll back again |
| Firewall rules data completely lost | Operators lose work | Drop firewall_rules table gently (soft delete, data preserved), operators can recreate |
| Partial rollback (some servers old version) | Inconsistency | Use zero-downtime restart; wait for all containers healthy |

## Tests / Validation

- [ ] **Rollback rehearsal on staging**: 2026-05-10, completed in 12 minutes
  - Feature flag disable: ✓ 2 min
  - Version revert: ✓ 10 min
  - Health checks: ✓ All green within 1 min
  - Metrics: ✓ Back to baseline within 2 min

- [ ] **Runbook reviewed by on-call**: 2026-05-11 pre-deployment call
  - On-call walked through every step
  - Questions answered
  - Confidence level: High

- [ ] **Rollback tested with actual data**: Staging replica with UAT dataset
  - Migration rollback successful
  - Table dropped cleanly
  - App started without errors
  - No data corruption observed

## Next steps

1. **DevOps** (`.ai/agents/devops.md`):
   - Keep this runbook accessible during deployment window
   - Be ready to execute if error rate spikes or critical issues detected
   - Document any actual rollback with root cause analysis

2. **Tech Lead** (`.ai/agents/tech-lead.md`):
   - Monitor metrics during deploy window
   - Be on call for escalations
   - Lead postmortem if rollback occurs

3. **On-call** (emergency backup):
   - Review this runbook before deployment window
   - Stay alert for 30 minutes post-deployment
   - Contact DevOps + Tech Lead if rollback triggered
