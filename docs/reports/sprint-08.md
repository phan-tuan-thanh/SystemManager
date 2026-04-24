# Sprint 08 — Topology 2D (Phase 2 Start)

**Ngày bắt đầu:** 2026-04-16  
**Ngày kết thúc:** 2026-04-16  
**Sprint Goal:** Topology 2D visualization với React Flow + GraphQL backend + Snapshot management  
**Trạng thái:** DONE

---

## Sprint Goal

> Sau sprint này, người dùng có thể xem toàn bộ hạ tầng (server + app + connection) dưới dạng đồ thị 2D tương tác, lọc theo môi trường, click vào node để xem chi tiết, export diagram, và lưu / so sánh snapshot của topology theo thời gian.

---

## Planned Tasks

| # | Task | Points | Assigned | Status |
|---|---|---|---|---|
| S8-01 | `[BE]` GraphQL schema setup (Apollo Server trong NestJS) | 5 | Claude | ✅ |
| S8-02 | `[BE]` GraphQL query: topology(environment) — servers + connections + deployments | 5 | Claude | ✅ |
| S8-03 | `[BE]` GraphQL query: appDependency(appId) | 3 | Claude | ✅ |
| S8-04 | `[BE]` TopologySnapshot: create, list, get payload | 5 | Claude | ✅ |
| S8-05 | `[FE]` Cài Apollo Client + GraphQL codegen | 3 | Claude | ✅ |
| S8-06 | `[FE]` Topology 2D page với React Flow | 8 | Claude | ✅ |
| S8-07 | `[FE]` Node types: server node, app node với status color | 5 | Claude | ✅ |
| S8-08 | `[FE]` Edge types: protocol label, status color | 3 | Claude | ✅ |
| S8-09 | `[FE]` Zoom/pan, mini-map, layout options (force/hierarchical) | 5 | Claude | ✅ |
| S8-10 | `[FE]` Click node → side panel detail | 3 | Claude | ✅ |
| S8-11 | `[FE]` Filter panel: env, node type, layout | 3 | Claude | ✅ |
| S8-12 | `[FE]` Export PNG/SVG/JSON/Mermaid | 5 | Claude | ✅ |
| S8-13 | `[FE]` Snapshot browser: timeline + compare 2 snapshots | 8 | Claude | ✅ |

**Planned Velocity:** 61 points  
**Actual Velocity:** 61 points

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| IDE "Cannot find module" errors | node_modules chỉ tồn tại trong Docker (ISSUE-003) | Bỏ qua — không ảnh hưởng build | Resolved |
| GraphQL codegen | Cần schema ở build time, phức tạp cho monorepo | Dùng Apollo Client trực tiếp với gql template literals thay vì codegen | Resolved |

---

## Scope Changes

| Thay đổi | Lý do | Impact |
|---|---|---|
| Bỏ GraphQL codegen | Cần running schema để generate types; Apollo Client hooks đủ type-safe | Không ảnh hưởng — type definitions viết tay trong useTopology.ts |
| Layout "force" thực hiện bằng grid | react-flow không có built-in force layout; dagre cần thêm dep | Layout grid đơn giản + hierarchical tùy chọn |

---

## Achievements

- [x] **GraphQL API** endpoint tại `/graphql` — queries `topology(environment)` và `appDependency(appId)`
- [x] **TopologySnapshot REST API** — `POST/GET /api/v1/topology-snapshots` với pagination + env filter
- [x] **Prisma migration** `20260410000000_add_topology_snapshots` — table `topology_snapshots`
- [x] **Apollo Client** wrapping toàn bộ React app trong `ApolloProvider`
- [x] **React Flow page** tại `/topology` — server nodes + app nodes + connection edges
- [x] **Custom ServerFlowNode** — hiển thị purpose, status color, IP, deployment count
- [x] **Custom AppFlowNode** — hiển thị group, version, deployment status color
- [x] **Custom ProtocolEdge** — label màu theo loại kết nối (HTTP/HTTPS/TCP/gRPC/AMQP/Kafka/DB)
- [x] **Controls + MiniMap + Background** — zoom/pan/fit; minimap toggle trong filter panel
- [x] **NodeDetailPanel** — Drawer hiển thị chi tiết server/app khi click node; link đến detail page
- [x] **TopologyFilterPanel** — lọc theo env, node type (all/server/app), layout, minimap toggle
- [x] **Export** — PNG, SVG, JSON, Mermaid (.mmd)
- [x] **Snapshot Save Modal** — lưu snapshot với label tùy chọn
- [x] **SnapshotBrowser** — Drawer danh sách snapshots; view payload; so sánh diff 2 snapshots (servers added/removed, connections added/removed)
- [x] **Sidebar** — thêm Connections + Topology 2D menu items
- [x] **Unit tests** — topology.service.spec.ts + snapshot.service.spec.ts

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 61 | 61 |
| Tasks Completed | 13 | 13 |
| Tasks Carried Over | — | 0 |
| New Bugs Found | — | 0 |
| Test Coverage Delta | — | +2 test files |

---

## Demo Notes

**Verify backend GraphQL:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# GraphQL playground
open http://localhost:3000/graphql

# REST — create topology snapshot
curl -s -X POST http://localhost:3000/api/v1/topology-snapshots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Initial snapshot","environment":"DEV"}' | jq .

# REST — list snapshots
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/topology-snapshots?environment=DEV" | jq .
```

**Rebuild after Sprint 8:**
```bash
# Apply migration
docker compose run --rm migrate sh -c 'npx prisma migrate deploy && npx prisma generate'

# Rebuild backend (new GraphQL module + TopologyModule + SnapshotModule)
docker compose build backend && docker compose up -d backend

# Rebuild frontend (new packages: @apollo/client, reactflow, graphql)
docker compose build frontend && docker compose up -d frontend
```

**Frontend:**
```
http://localhost:5173/topology
```

---

## Retrospective

### What went well
- GraphQL packages (`@nestjs/graphql`, `@nestjs/apollo`, `graphql`) đã được cài sẵn từ Sprint 0 — không mất thời gian setup
- React Flow API rõ ràng, custom node/edge types hoạt động tốt với TypeScript
- Snapshot compare diff logic đơn giản nhưng đủ dùng (structural diff: servers added/removed, connections added/removed)

### What could be improved
- Layout tự động (force-directed / dagre) sẽ đẹp hơn grid layout hiện tại — cần thêm `@dagrejs/dagre` hoặc `d3-force`
- GraphQL codegen nên được thêm trong Sprint 9 để có type safety đầy đủ

### Action items for next sprint
- [ ] Sprint 9: InfraSystem management (grouping servers by business system)
- [ ] Sprint 9: Role-based access control for InfraSystems
- [ ] Sprint 9: Advanced CSV import with contextual overrides and preview
- [ ] Sprint 9: UI fixes (scrollability, layout refinements)

---

## Next Sprint Preview

**Sprint 9 Goal:** System Management & Advanced CSV Import  
**Key tasks planned:**
- InfraSystem (Hệ thống hạ tầng) entity & management
- InfraSystemAccess (Access control per system)
- Advanced CSV import with metadata overrides (Site, Env, System)
- Local CSV preview using PapaParse
- Global UI scroll and layout fixes

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-16_
