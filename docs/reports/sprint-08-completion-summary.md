# Sprint 8 — Topology 2D Completion Summary

> **Date:** 2026-04-16  
> **Status:** ✅ **MERGED TO MAIN** (MR !1)  
> **Includes:** Sprint 7 + Sprint 8 (54 + 61 = 115 story points)

---

## What's Done

### Sprint 7 — Connection & Audit Log ✅

**Backend:**
- AppConnection CRUD (source/target apps, protocol, port) with GraphQL queries
- Audit log filtering, search, export CSV

**Frontend:**
- Audit Log page: searchable timeline with filters (user, action, resource, time range)
- Connection management: CRUD modal, dependency tree visualization
- Integration: E2E tests (auth flow + full CRUD workflow)

**Database:**
- `app_connections` table with soft delete
- Audit log queries optimized for 100k+ records

---

### Sprint 8 — Topology 2D ✅

**Backend:**
- GraphQL API: `topology(environment)` returns servers + connections + deployments
- TopologySnapshot module: save/restore/compare snapshots
- Prisma migration for `topology_snapshots` table
- Fixed global interceptors (Transform, AuditLog) to skip GraphQL contexts

**Frontend:**
- **Topology 2D page** (600+ lines React component)
  - React Flow canvas with zoom/pan/minimap
  - **Server nodes**: rectangular card style with left accent bar, purpose-specific icon (DB, Proxy, LB, Cache, MQ), hostname/IP display
  - **App nodes**: rounded pill/capsule style, status-colored gradient background, version + deployment status tags
  - **Edge labels**: protocol + port (e.g., "HTTP:8080")
  - **Status colors**: RUNNING (green), STOPPED (red), MAINTENANCE (yellow), DEPRECATED (gray)

- **Smart auto-layout** (dagre-based)
  - Hierarchical (TB) or left-to-right (LR) layout
  - Prevents node overlap, minimizes edge crossings
  - "Auto Arrange" button positions all nodes optimally in real-time
  - Configurable spacing: 60px node gap, 100px rank gap

- **Snapshot browser panel**
  - Timeline of all topology snapshots
  - Snapshot metadata: timestamp, environment, node/edge count
  - Restore snapshot feature
  - (Compare 2 snapshots feature ready for future enhancement)

- **Filter panel** (absolute positioned, top-left)
  - Environment filter (DEV/UAT/PROD/All)
  - Node type filter: Servers & Apps / Servers only / Apps only
  - Layout toggle: Auto layout (force) / Hierarchical
  - Mini-map toggle

- **Node detail side panel**
  - Click any node → slide-in detail panel
  - Display all server/app metadata, connections, deployments
  - Close button dismisses panel

- **Apollo Client integration**
  - GraphQL codegen for type-safe queries
  - Real-time topology data fetch
  - Vite proxy to backend `/graphql` endpoint

**UI Improvements:**
- Dark color scheme for professional appearance
- Smooth transitions (0.2s) on node selection
- Visual feedback: selected node gets blue border + shadow
- Responsive design: nodes adapt size to content

**Testing:**
- Playwright E2E tests: auth → CRUD operations → deployment flow
- Full Docker integration test in compose

---

## Key Fixes & Learnings

### Issue 1: Prisma Field Naming
**Problem:** Topology service used camelCase `deletedAt` but Prisma schema uses snake_case `deleted_at`  
**Fix:** Updated all 5 occurrences in `topology.service.ts`  
**Lesson:** Always match Prisma schema conventions (snake_case for DB columns)

### Issue 2: GraphQL Response Wrapping
**Problem:** Global `TransformInterceptor` wrapped GraphQL responses as `{data: {data: ...}}`, breaking field resolution  
**Fix:** Added context type check to skip wrapping for non-HTTP contexts:
```typescript
if (context.getType() !== 'http') return next.handle();
```
**Lesson:** Global NestJS interceptors/guards must be GraphQL-aware (5 components affected)

### Issue 3: Node Overlap
**Problem:** Naive 4-column grid layout caused nodes to overlap, hiding information  
**Fix:** Implemented dagre-based directed graph layout with proper spacing  
**Lesson:** Always use layout algorithms for graph visualization, not hand-coded grids

### Issue 4: Visual Differentiation
**Problem:** Server and App nodes looked too similar  
**Fix:** Completely redesigned both:
- Server = rectangular infrastructure card with left accent bar
- App = rounded pill/capsule shape
- Different icon styles, color palettes, and layout
**Lesson:** Distinct visual shapes aid user comprehension at a glance

---

## Metrics

| Category | Value |
|---|---|
| **Backend additions** | 3 new modules (connection, topology, snapshot) |
| **Database** | 1 new table, 1 migration |
| **Frontend components** | 6 new topology-related components |
| **Lines of code** | ~5000 additions, 69 files changed |
| **Story points** | 115 (Sprint 7: 54, Sprint 8: 61) |
| **Time** | 1 week (2026-04-10 → 2026-04-16) |

---

## Dependencies Added

- **Frontend**: `dagre` (0.8.5) for graph layout
- **GraphQL**: Apollo Client codegen integration

---

## Ready for Next Phase

Sprint 9 can now proceed with:
- Topology 3D (React Three Fiber)
- GraphQL subscriptions for realtime updates
- WebSocket gateway setup

---

## Notes for Future Work

1. **Snapshot comparison UI**: Currently data is captured but UI panel needs implementation
2. **Advanced filters**: Could add protocol-based filtering, deployment status filtering
3. **Performance**: Monitor topology render time for 100+ node graphs (recommend virtual scrolling if needed)
4. **Export features**: Topology export to PNG/SVG/JSON/Mermaid not yet implemented (listed as S8-12)
