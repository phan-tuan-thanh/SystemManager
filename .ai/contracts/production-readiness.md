# Production-readiness checklist (Stage 13)

Every item must be ✓ or have a recorded waiver before Stage 14.

## Scalability
- [ ] Capacity model confirms headroom at peak traffic.
- [ ] Resource requests / limits sized; auto-scaling configured if applicable.
- [ ] No unbounded growth (queues, caches, in-memory collections).

## Observability
- [ ] Structured logs with correlation / request id at every entry point.
- [ ] Metrics for latency, error rate, throughput, saturation (RED / USE).
- [ ] Tracing spans on every external call.
- [ ] Dashboard exists or updated for the new path.

## Monitoring & alerting
- [ ] Alert defined for each SLO breach.
- [ ] Alerts routed to on-call channel.
- [ ] No alert without a runbook entry.
- [ ] Synthetic / smoke check covers the new path.

## Resiliency
- [ ] Timeouts on every external call.
- [ ] Retries bounded (count + total elapsed) with backoff + jitter.
- [ ] Circuit breaker / bulkhead where downstream is shared.
- [ ] Graceful degradation defined for each external dependency.

## Concurrency & data integrity
- [ ] Idempotency on every state-changing operation.
- [ ] Locking / optimistic concurrency strategy documented.
- [ ] Transactions bounded; no long-held locks.
- [ ] Migrations are additive-then-subtractive; rollback proven on staging.

## Rollback safety
- [ ] Rollback steps documented and timed (target < 15 min).
- [ ] Feature flag or deploy-time toggle to disable the new path.
- [ ] Data divergence post-rollback documented.

## Security
- [ ] AuthN / AuthZ verified for new endpoints.
- [ ] Input validation at the boundary.
- [ ] Secrets via secret store, not env / config files in repo.
- [ ] Audit log entry for sensitive mutations.
- [ ] No PII / secrets in logs or telemetry.

## Compliance & data
- [ ] Data classification applied; retention / masking honoured.
- [ ] Cross-region / sovereignty constraints respected.

## Documentation
- [ ] Runbook updated.
- [ ] API docs / changelog updated.
- [ ] ADR(s) merged for any new principle.
- [ ] Traceability: Epic → Story → Task → PR → Release recorded.

## Release mechanics
- [ ] Version bumped per `commit-policy.md`.
- [ ] Release notes published.
- [ ] Deployment plan + rollback plan attached.
- [ ] Pre-prod smoke green.
- [ ] On-call notified; deploy window booked.
