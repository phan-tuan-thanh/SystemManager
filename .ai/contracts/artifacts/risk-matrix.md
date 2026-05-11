# Risk Matrix: <Title>

[Header per `_header.md`]

| Risk | Category | Likelihood (L/M/H) | Impact (L/M/H) | Detection | Mitigation | Residual | Owner |
|------|----------|---------------------|----------------|-----------|------------|----------|-------|

## Categories considered
- Functional regression
- Performance
- Scalability
- Concurrency
- Data integrity
- Backwards compatibility
- Security
- Privacy / compliance
- Availability
- Operational
- Vendor / dependency
- Rollback
- People / process

(Mark "N/A" with one-line reason for any category not applicable.)

## Acceptance rule
Any risk with Likelihood ≥ M and Impact ≥ M must have a mitigation that
drops residual to L, OR an explicit ADR-level acceptance.

## Tests / Validation
- Reviewed by Architect + DevOps + QA on <date>.

## Next steps
1. Tech Lead: task breakdown reflecting mitigations.
