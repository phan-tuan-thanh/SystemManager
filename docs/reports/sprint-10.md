# Sprint 10 — Topology 3D & Realtime

**Ngày bắt đầu:** 2026-04-21  
**Ngày kết thúc:** 2026-04-21  
**Sprint Goal:** Bổ sung 3D visualization với React Three Fiber và GraphQL Subscriptions realtime cho trang Topology  
**Trạng thái:** DONE ✅

---

## Sprint Goal

> Sau sprint này, người dùng có thể chuyển đổi giữa chế độ 2D (React Flow) và 3D (React Three Fiber) trên trang Topology, quan sát hạ tầng theo 3 lớp vật lý (Y=0/5/10), dùng Explode view để tách DC/DR, và nhận cập nhật trạng thái server/connection realtime qua GraphQL Subscriptions.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S10-01 | `[BE]` GraphQL subscriptions: serverStatusChanged, connectionStatusChanged, topologyChanged | 8 | ✅ |
| S10-02 | `[BE]` WebSocket gateway (graphql-ws protocol) trong GraphQLModule | 5 | ✅ |
| S10-03 | `[BE]` PATCH /servers/:id/status — cập nhật trạng thái + pubsub.publish | 2 | ✅ |
| S10-04 | `[FE]` Apollo WS link (GraphQLWsLink + split) + useTopologySubscription hook | 5 | ✅ |
| S10-05 | `[FE]` Topology3DView.tsx với Canvas + OrbitControls + Stars | 13 | ✅ |
| S10-06 | `[FE]` ServerNode3D (RoundedBox) + AppNode3D (Sphere) theo layer Y=5/10 | 5 | ✅ |
| S10-07 | `[FE]` Explode view: tách DC/DR theo site với animation lerp | 5 | ✅ |
| S10-08 | `[FE]` Hover highlight connections (ConnectionEdge3D) + OrbitControls | 3 | ✅ |
| S10-09 | `[FE]` 2D/3D Segmented switcher trong toolbar Topology | 2 | ✅ |
| S10-10 | `[FE]` Realtime event badge + auto-refetch khi có subscription event | 3 | ✅ |

**Planned Velocity:** 51 points  
**Actual Velocity:** 51 points

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| ServerModule cần PubSub từ TopologyModule | Tiềm ẩn circular dependency | Import TopologyModule vào ServerModule (không circular vì Topology không import Server trở lại) | Resolved ✅ |
| `Inject` decorator import sai từ `@nestjs/graphql` | TopologyResolver dùng sai package | Đổi sang `@nestjs/common` | Resolved ✅ |
| Circular import giữa server.service.ts và topology.module.ts | Constants khai báo trong module file | Tách ra `topology.constants.ts` riêng | Resolved ✅ (commit 351437d) |
| PageHeader chỉ nhận `title: string` | Props interface cũ không hỗ trợ ReactNode | Mở rộng: `title: React.ReactNode`, thêm `subtitle?: React.ReactNode` | Resolved ✅ |

---

## Scope Changes

| Thay đổi | Lý do | Impact |
|---|---|---|
| Không có | Sprint hoàn thành đúng scope | — |

---

## Achievements

- [x] GraphQL Subscriptions hoạt động với giao thức `graphql-ws` (không dùng deprecated `subscriptions-transport-ws`)
- [x] `TOPOLOGY_PUB_SUB` injection token (InMemoryPubSub) — dễ thay thế Redis PubSub khi scale
- [x] 3 subscription resolvers: `serverStatusChanged`, `connectionStatusChanged`, `topologyChanged`
- [x] `PATCH /api/v1/servers/:id/status` publish event realtime sau mỗi status update
- [x] Apollo Client `split()` link: HTTP cho queries/mutations, WS cho subscriptions — transparent
- [x] `useTopologySubscription` hook gói 3 subscription với auto-refetch callback
- [x] `Topology3DView` với 3 layer rõ ràng: Y=0 (Physical ground), Y=5 (Servers), Y=10 (Apps)
- [x] Explode view: DC servers offset âm (-15), DR offset dương (+15); toggle animation lerp qua `useFrame`
- [x] Hover trên AppNode3D → highlight tất cả `ConnectionEdge3D` liên quan (màu vàng)
- [x] 2D/3D switcher `<Segmented>` đồng bộ state filter + view mode
- [x] Realtime event badge hiển thị event cuối cùng nhận được trong toolbar

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 51 | 51 |
| Tasks Completed | 10 | 10 |
| Tasks Carried Over | 0 | 0 |
| New Bugs Found | 0 | 1 (circular import — fixed inline, commit 351437d) |
| Test Coverage Delta | — | — |

---

## Files Changed

### Backend (commit 9d27398 + 351437d)

| File | Thay đổi |
|---|---|
| `packages/backend/package.json` | Thêm `graphql-subscriptions`, `graphql-ws`, `ws` |
| `packages/backend/src/app.module.ts` | Bật `subscriptions: { 'graphql-ws': true }` trong GraphQLModule |
| `src/modules/topology/topology.module.ts` | Cung cấp `TOPOLOGY_PUB_SUB` (InMemoryPubSub), export |
| `src/modules/topology/topology.resolver.ts` | Thêm 3 `@Subscription` resolvers, dùng `withFilter` |
| `src/modules/topology/topology.types.ts` | NEW — `ServerStatusPayload`, `ConnectionStatusPayload`, `TopologyChangedPayload` |
| `src/modules/topology/topology.constants.ts` | NEW — `TOPOLOGY_PUB_SUB`, event name constants |
| `src/modules/server/server.module.ts` | Import `TopologyModule` để inject PubSub |
| `src/modules/server/server.service.ts` | Inject `TOPOLOGY_PUB_SUB`, thêm method `updateStatus()` |
| `src/modules/server/server.controller.ts` | Thêm `PATCH :id/status` endpoint |

### Frontend (commit 9d27398)

| File | Thay đổi |
|---|---|
| `packages/frontend/package.json` | Thêm `@react-three/fiber`, `@react-three/drei`, `three`, `graphql-ws`, `@types/three` |
| `src/main.tsx` | Cấu hình `GraphQLWsLink` + `split()` link cho Apollo Client |
| `src/graphql/topology.ts` | Thêm 3 subscription GQL documents |
| `src/pages/topology/hooks/useTopologySubscription.ts` | NEW — subscription hook (3 subs + callbacks) |
| `src/pages/topology/components/Topology3DView.tsx` | NEW — Canvas + OrbitControls + Stars, layer layout |
| `src/pages/topology/components/nodes/ServerNode3D.tsx` | NEW — RoundedBox mesh, status color |
| `src/pages/topology/components/nodes/AppNode3D.tsx` | NEW — Sphere mesh, hover highlight |
| `src/pages/topology/components/edges/ConnectionEdge3D.tsx` | NEW — QuadraticBezierLine |
| `src/pages/topology/index.tsx` | 2D/3D switcher + realtime badge + subscription wiring |
| `src/components/common/PageHeader.tsx` | ReactNode title + subtitle prop |

---

## Demo Notes

```bash
# 1. Rebuild với dependencies mới
docker compose build backend frontend && docker compose up -d

# 2. Lấy token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# 3. Test PATCH /servers/:id/status
SRV=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/servers \
  | jq -r '.data[0].id')
curl -s -X PATCH "http://localhost:3000/api/v1/servers/$SRV/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"MAINTENANCE"}' | jq '{id: .data.id, status: .data.status}'

# 4. Test GraphQL subscription qua playground
# Mở http://localhost:3000/graphql (HTTP mode — subscription cần WS client)
# subscription { serverStatusChanged { id name status environment } }
# Sau đó PATCH status → xem event xuất hiện realtime

# 5. Frontend
# Mở http://localhost:5173/topology
# → Click "3D" tab để xem 3D view
# → Click "Explode" để tách DC / DR cluster
# → Hover node để xem connections highlight vàng
# → Khi PATCH server status → thấy realtime badge cập nhật
```

---

## Retrospective

### What went well
- `graphql-ws` tích hợp clean với NestJS/Apollo, không breaking change với GraphQL module cũ
- R3F layer architecture rõ ràng (Y=0/5/10) → dễ extend thêm layer sau
- `split()` link trong Apollo Client transparent — queries/mutations không bị ảnh hưởng
- Circular import được phát hiện và giải quyết ngay trong sprint (tách constants ra file riêng)

### What could be improved
- InMemoryPubSub → cần migrate Redis PubSub khi scale multi-instance
- 3D animation chưa có transition mượt khi switch 2D → 3D (instant pop)
- Chưa có E2E test cho subscription flow
- Preview page (Sprint 11) sẽ tái dùng 3D canvas để visualize diff tốt hơn

### Action items cho Sprint 11
- [x] Sprint 11: ChangeSet workflow (draft, preview, apply) — DONE

---

## Next Sprint Preview

**Sprint 11 Goal:** ChangeSet Draft & Preview — staging area cho thay đổi hạ tầng  
**Key tasks:**
- ChangeSet CRUD backend + PreviewEngine (IP/Port/Circular conflict detection)
- Apply ACID transaction + auto TopologySnapshot
- Frontend: List, Detail (ChangeItemDiff), Preview mode

---

_Report tạo bởi: Claude Code Agent_  
_Cập nhật lần cuối: 2026-04-21_
