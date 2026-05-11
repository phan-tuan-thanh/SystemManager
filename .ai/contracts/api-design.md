# API design contract (transport-agnostic)

Applies to HTTP, gRPC, message queues, CLIs, and library exports.

- Naming: verbs for actions, nouns for resources, consistent casing.
- Versioning: explicit (`/v1/`, `package@1.x`, queue topic `…-v1`). Never break v1 silently.
- Errors: typed and stable. Document each error code / shape.
- Pagination: cursor-based for unbounded collections; never `LIMIT`-less list endpoints.
- Idempotency: every state-changing operation accepts an idempotency key.
- Backwards compatibility: additive changes only without an ADR.
- Observability: each entry point emits a structured event with the request id.
