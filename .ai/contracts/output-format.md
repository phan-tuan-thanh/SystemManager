# Output contract (every agent deliverable)

Every plan, design, PR description, or review note must include all five sections.

## Summary
1–3 sentences: what was done or proposed.

## Changed files
Bulleted list of files touched, each annotated `(added | modified | deleted)`.

## Risks
Risks + mitigations:
- Risk: <what could go wrong>
  Mitigation: <how it is bounded>

## Tests
- Unit: <count, coverage>
- Integration: <what is exercised>
- Regression: <what was verified to still work>

## Next steps
1. <next concrete action>
2. <dependency>
3. <blocker if any>

Missing any section = contract violation. Reviewer rejects the deliverable.
