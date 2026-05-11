# Monitoring Checklist: <Release / Feature>

[Header per `_header.md`]

## Metrics
- [ ] Latency (p50 / p95 / p99) on new path.
- [ ] Error rate on new path.
- [ ] Throughput / RPS.
- [ ] Saturation (CPU / mem / queue depth).

## Logs
- [ ] Structured, with correlation id at every entry point.
- [ ] No PII / secrets.
- [ ] Sample rate configured.

## Tracing
- [ ] Span on every external call.
- [ ] Trace propagation verified end-to-end.

## Alerts
- [ ] Alert per SLO breach.
- [ ] Routed to on-call channel.
- [ ] Each alert linked to a runbook entry.

## Synthetics
- [ ] Synthetic check exercises new path.

## Dashboards
- [ ] Updated / created.

## Risks
- <risk> → <mitigation>

## Tests / Validation
- Verified in staging on <date>.

## Next steps
1. DevOps: tune alert thresholds after first traffic cycle.
