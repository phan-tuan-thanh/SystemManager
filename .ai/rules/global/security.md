# Global security rules (any stack)

NEVER:
- Hardcode credentials, API keys, or tokens in code or config.
- Log secrets, tokens, full request bodies for sensitive routes, or PII.
- Send secrets in URLs or query strings (use headers / env / secret store).
- Skip transport security (always TLS for cross-network calls).
- Concatenate untrusted input into queries, shell commands, or eval-like calls.
- Store passwords or sensitive payloads in plaintext.

ALWAYS:
- Read secrets from environment variables or a secrets manager.
- Validate and normalise all external input at the boundary.
- Use parameterised queries / prepared statements / safe builders.
- Hash passwords with a memory-hard algorithm (Argon2 / bcrypt / scrypt).
- Apply least-privilege to data access (RBAC / ABAC).
- Add an audit trail for sensitive mutations (who, what, when).

## PR checklist
- [ ] No credentials in code or commit history.
- [ ] No injection vectors (SQL, shell, template, deserialization).
- [ ] Transport secured.
- [ ] Rate limiting on externally-reachable endpoints.
- [ ] Error messages do not leak system internals.
- [ ] Logs exclude sensitive fields.
