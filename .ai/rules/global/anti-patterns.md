# Forbidden patterns (any stack)

- "God object" / module that knows about everything.
- Catch-all `try { … } catch { /* swallow */ }` blocks.
- Magic numbers without a named constant + comment.
- Cyclic imports / cyclic module dependencies.
- Copy-paste code across more than two call sites (extract instead).
- Reaching into a module's private internals.
- Time / randomness / I/O hardcoded inside pure logic (inject them).
- Tests that depend on wall-clock time, network reachability, or test execution order.
