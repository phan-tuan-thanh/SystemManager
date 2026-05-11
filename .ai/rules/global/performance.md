# Global performance rules (any stack)

NEVER:
- Issue unbounded queries / scans / list operations on large data sets.
- Hold expensive resources (connections, file handles, locks) longer than needed.
- Run unbounded loops over external input.
- Block the main thread / event loop on I/O.
- Use O(n²) algorithms on inputs that can grow without bound.

ALWAYS:
- Paginate or stream collections that can exceed a known bound.
- Set timeouts on every external call.
- Bound retries (count + total elapsed time).
- Add an index for any field used in WHERE / equality / range filters.
- Profile before optimising; document any non-obvious tuning.
