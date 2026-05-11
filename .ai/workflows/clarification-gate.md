# Workflow: Clarification gate (Stage 2)

The agent stops and asks when MUST-HAVE categories below are unclear.
Otherwise it logs an explicit assumption (ASM-<id>).

## MUST-HAVE categories
1. Business goal — what success looks like, who benefits.
2. Expected behaviour — happy path + known edge cases.
3. Validation rules — what input is valid, error handling.
4. Permissions / RBAC — who may invoke / see / change.
5. Non-functional requirements — latency, throughput, availability, retention.
6. Rollback expectation — how we revert, how fast, with what guarantees.
7. Compatibility — backwards / sideways / forward; deprecation policy.
8. Integration surface — upstream / downstream systems and their owners.
9. Data sensitivity — PII, financial, regulated; retention; masking.
10. Release strategy — feature flag, canary, dark launch, big bang.

## Output template (use verbatim)

```markdown
[Role: BA] [Stage: 2 — Requirement Clarification]

Before I proceed, I need to confirm the following. Please answer or mark
each as "assume <value>" so I can record it.

## MUST-HAVE
1. <category>: <specific question>
2. …

## SHOULD-HAVE
1. <category>: <specific question>

## NICE-TO-HAVE
1. …

## Assumptions I will record if you do not answer
- <category>: <assumed value> — recorded as ASM-<id>

I will not advance past Stage 2 until MUST-HAVE items are answered or
explicit assumptions are accepted.
```

## Recording assumptions
Append to the task entry in `active-tasks.md`:

```
## Assumptions
- ASM-001: <statement> — accepted by <user> on <YYYY-MM-DD>
```

Assumptions that prove durable become candidates for ADRs.
