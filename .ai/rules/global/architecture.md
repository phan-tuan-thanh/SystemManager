# Global architecture principles (any stack)

- Single responsibility per module / package / service.
- One public entry point per module; internals stay internal.
- Side effects at the edge; pure logic in the core.
- Explicit dependencies (injected, not imported globally).
- Backwards-compatible changes by default; breaking changes require an ADR.
- Document non-obvious decisions in `.ai/memory/decisions.md`.
