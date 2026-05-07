# Sprint 25 Report — Two-Layer Connectivity Model: Firewall Coverage & Implied Connections

**Ngày hoàn thành:** 2026-05-08  
**Branch:** `feat/sprint-25-connectivity-model`  
**Story Points:** 25/25 ✅

---

## Tổng quan

Triển khai mô hình kết nối 2 lớp: cross-validate AppConnection với FirewallRule để cảnh báo thiếu phủ sóng mạng, và render implied connections từ FirewallRule ALLOW trong App Topology.

---

## Tính năng đã implement

### [BE] S25-01: ConnectionService — Firewall Coverage Validation

**File:** `packages/backend/src/modules/connection/connection.service.ts`

- `getFirewallCoverageStatus(connectionId)` — 6 bước cross-validation:
  1. Load AppConnection + source/target app deployments + NetworkConfig IPs
  2. Trả `NO_PORT` nếu không có `target_port_id`
  3. Thu thập source server IPs (private + public)
  4. Tìm target server qua deployment owning target port
  5. Trả `UNKNOWN` nếu không có deployment
  6. Query FirewallRule ALLOW ACTIVE, check CIDR/exact IP matching → `COVERED`/`UNCOVERED`
- `getFirewallCoverageStatusBatch(environment)` — fan-out parallel cho toàn bộ env
- Helper `ipMatchesCidrOrExact()` — CIDR /24, /16, /8, exact matching

### [BE] S25-02: ConnectionController — 2 Endpoints Mới

```
GET /api/v1/connections/firewall-coverage?environment=PROD
GET /api/v1/connections/:id/firewall-coverage
```

### [BE] S25-03: TopologyService — Implied Connections

**Files:** `topology.service.ts`, `topology.types.ts`

- `getImpliedConnections(environment)` — suy ra connections từ FirewallRule ALLOW active:
  - Resolve target app từ `destination_port.application_id`
  - Resolve source servers từ zone IP entries (CIDR) hoặc source_ip
  - Tạo synthetic `ImpliedConnectionEdge` (id: `implied-{ruleId}-{srcApp}-{tgtApp}`)
  - Deduplicate + loại bỏ pairs đã có AppConnection explicit
- `TopologyData` thêm field `impliedConnections: ImpliedConnectionEdge[]`
- GraphQL resolver tự động expose qua schema

### [FE] S25-04: Hook useConnectionFirewallCoverage

```typescript
useConnectionFirewallCoverage(environment) → Record<connectionId, FirewallCoverageResult>
```

### [FE] S25-05: AppConnection List — Coverage Badge Column

Column "Firewall" với badge:
- ✅ Covered (xanh) — có FirewallRule ALLOW phủ
- ⚠️ Uncovered (vàng) — thiếu FirewallRule, cần xin cấp
- — No port (xám) — chưa khai báo target_port
- Chỉ load coverage khi filter theo environment

### [FE] S25-06: App Topology — Implied Edges + Toggle

- GraphQL query cập nhật: thêm `impliedConnections { ... }` field
- Implied edges: nét đứt, màu `#91d5ff` (light blue), opacity 0.7
- Toggle button "Implied" trong toolbar — ẩn/hiện implied edges
- Default: hiển thị implied edges

### [FE] S25-07: FirewallRule Detail — AppConnections Section

Trong rule detail drawer (FirewallTopologyView):
- Section "Kết nối ứng dụng dùng rule này (N)"
- Filter connections theo `target_port_id === rule.destination_port_id`
- Empty state nếu chưa có AppConnection khai báo

### [FE] S25-08: Firewall Topology — Badge Count

Mỗi ALLOW edge trong Firewall Topology hiển thị:
- "TCP 443 (ALLOW) · 3 app" — nếu có AppConnection dùng port này
- "TCP 443 (ALLOW) · no app" — nếu chưa có khai báo (implied-only connectivity)

### [FE] S25-09: DependencyTree — Coverage Badge

Upstream/downstream trong Dependency Modal:
- Mỗi connection row có badge ✅ FW (Covered) hoặc ⚠️ No FW (Uncovered)
- Load coverage theo environment của DependencyTree

---

## Files thay đổi

### Backend
| File | Loại |
|------|------|
| `packages/backend/src/modules/connection/connection.service.ts` | update |
| `packages/backend/src/modules/connection/connection.controller.ts` | update |
| `packages/backend/src/modules/topology/topology.service.ts` | update |
| `packages/backend/src/modules/topology/topology.types.ts` | update |

### Frontend
| File | Loại |
|------|------|
| `packages/frontend/src/hooks/useConnections.ts` | update |
| `packages/frontend/src/types/connection.ts` | update |
| `packages/frontend/src/graphql/topology.ts` | update |
| `packages/frontend/src/pages/topology/hooks/useTopology.ts` | update |
| `packages/frontend/src/pages/topology/index.tsx` | update |
| `packages/frontend/src/pages/topology/components/FirewallTopologyView.tsx` | update |
| `packages/frontend/src/pages/connection/index.tsx` | update |
| `packages/frontend/src/pages/connection/components/DependencyTree.tsx` | update |

---

## Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

# Batch coverage
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/connections/firewall-coverage?environment=PROD" | jq .

# Single connection coverage
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/connections/<id>/firewall-coverage" | jq .
```

---

## Known Issues

- `getFirewallCoverageStatusBatch` dùng N parallel DB calls — OK với vài trăm connections, có thể optimize thành bulk query nếu cần.
- Implied edges trong vis-network/3D topology chưa được implement (chỉ áp dụng cho ReactFlow tab).
