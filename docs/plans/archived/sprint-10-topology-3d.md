# Kế hoạch triển khai — Sprint 10: Topology 3D & Realtime

**Dự án:** SystemManager  
**Mục tiêu:** Cung cấp khả năng quan sát hạ tầng trực quan 3D và cập nhật trạng thái kết nối/server theo thời gian thực (Realtime) qua GraphQL Subscriptions.

---

## 1. Thành phần Backend ([BE])

### 1.1. Hạ tầng WebSocket & GraphQL Subscriptions
- **Thư viện:** `@nestjs/graphql`, `graphql-ws`, `graphql-subscriptions`.
- **Tác vụ:**
    - Cấu hình `GraphQLModule` hỗ trợ `subscriptions` với giao thức `graphql-ws`.
    - Thiết lập `PubSub` engine (mặc định dùng `InMemoryPubSub` cho môi trường Dev).
    - Tạo `TopologyGateway` hoặc tích hợp Subscription vào `TopologyResolver`.

### 1.2. Subscription Resolvers
- **`connectionStatusChanged(environment)`**: Trả về payload khi một kết nối thay đổi trạng thái (Healthy/Down).
- **`serverStatusChanged`**: Trả về thông tin server khi bị Inactive/Active hoặc thay đổi tài nguyên.
- **`topologyChanged(environment)`**: Thông báo khi có một `ChangeSet` được Apply để Frontend tự động refetch hoặc update cục bộ.

### 1.3. API Cập nhật trạng thái
- **Endpoint:** `PATCH /api/v1/servers/:id/status` và `PATCH /api/v1/connections/:id/status`.
- **Logic:** Cập nhật DB đồng thời `pubsub.publish` flow để đẩy tin nhắn đến Client qua WebSocket.

---

## 2. Thành phần Frontend ([FE])

### 2.1. Apollo Subscriptions Client
- Cấu hình `GraphQLWsLink` trong `ApolloProvider`.
- Xử lý split link: `HTTP` cho Queries/Mutations, `WS` cho Subscriptions.

### 2.2. Topology 3D Visualization
- **Thư viện:** `@react-three/fiber`, `@react-three/drei`, `three`.
- **Phân tầng (Layering logic):**
    - **Tầng 0 (Y=0):** Physical Layer (Racks/DC).
    - **Tầng 1 (Y=5):** Server Layer (Nodes hình hộp).
    - **Tầng 2 (Y=10):** Application Layer (Nodes hình cầu/capsule).
- **Tính năng tương tác:**
    - `OrbitControls` để xoay, zoom.
    - `Explode view`: Tự động tách các cụm Server theo Site (DC/DR) hoặc Môi trường bằng animation.
    - `Highlight path`: Khi click vào 1 App, highlight toàn bộ các tia kết nối (Edges) liên quan trong không gian 3D.

### 2.3. Chế độ hiển thị (Switcher)
- Thêm nút chuyển đổi 2D/3D trên thanh công cụ.
- Đồng bộ state lọc (Environment, System) khi chuyển đổi giữa 2 view.

---

## 3. Chi tiết tác vụ & Danh sách File tác động

### TASK 1 — [BE] Setup WebSocket Gateway & GraphQL Subscriptions
**Mục tiêu:** Kích hoạt giao thức `graphql-ws` để hỗ trợ Realtime.
- **File:** `packages/backend/src/app.module.ts`
    - Cấu hình `GraphQLModule.forRoot`:
      ```ts
      subscriptions: { 'graphql-ws': true, 'subscriptions-transport-ws': true }
      ```
- **File:** `packages/backend/src/modules/topology/topology.module.ts`
    - Cung cấp `PubSub` provider (In-memory).

### TASK 2 — [BE] Subscription Resolvers & Event Triggers
**Mục tiêu:** Định nghĩa các sự kiện Subscription và bắn tin nhắn khi dữ liệu thay đổi.
- **File:** `packages/backend/src/modules/topology/topology.resolver.ts`
    - Thêm `@Subscription()` cho `serverStatusChanged`, `connectionStatusChanged`.
- **File:** `packages/backend/src/modules/server/server.service.ts` & `server.controller.ts`
    - Gọi `pubsub.publish('serverStatusChanged', ...)` trong method `updateStatus`.
- **File:** `packages/backend/src/modules/connection/connection.service.ts`
    - Gọi `pubsub.publish('connectionStatusChanged', ...)` khi trạng thái kết nối đổi (Healthy/Down).

### TASK 3 — [FE] Apollo WS Link & Realtime Hooks
**Mục tiêu:** Cấu hình Client để nhận tin nhắn qua WebSocket.
- **File:** `packages/frontend/src/api/apollo-client.ts` (hoặc `main.tsx`)
    - Thiết lập `createClient` từ `graphql-ws`.
    - Dùng `split()` để điều hướng traffic.
- **File:** `packages/frontend/src/pages/topology/hooks/useTopologySubscription.ts` **(NEW)**
    - Custom hook sử dụng `useSubscription` để cập nhật local state của React Flow/Three Fiber.

### TASK 4 — [FE] 3D Engine Setup & Base Layering
**Mục tiêu:** Dựng khung cảnh 3D và thuật toán phân tầng.
- **File:** `packages/frontend/src/pages/topology/components/Topology3DView.tsx` **(NEW)**
    - Sử dụng `<Canvas />`, `<OrbitControls />`.
- **File:** `packages/frontend/src/pages/topology/components/nodes/ServerNode3D.tsx` **(NEW)**
    - Mẫu `Mesh` hình hộp với chất liệu (Material) phản ánh trạng thái.
- **File:** `packages/frontend/src/pages/topology/components/nodes/AppNode3D.tsx` **(NEW)**
    - Mẫu `Mesh` hình cầu hoặc Capsule.

### TASK 5 — [FE] 3D Interaction: Explode View & Highlight
**Mục tiêu:** Animation tách cụm và hiệu ứng liên kết.
- **File:** `packages/frontend/src/pages/topology/components/Topology3DView.tsx`
    - Tính toán vị trí Z/X dựa trên Site (DC: x < 0, DR: x > 0).
    - Animation chuyển đổi vị trí khi bật "Explode view".
- **File:** `packages/frontend/src/pages/topology/components/edges/ConnectionEdge3D.tsx` **(NEW)**
    - Vẽ đường line nối giữa các nodes bằng `TubeGeometry` hoặc `Line`.

### TASK 6 — [FE] Switcher 2D/3D & UI Integration
**Mục tiêu:** Nút chuyển đổi và đồng bộ bộ lọc.
- **File:** `packages/frontend/src/pages/topology/index.tsx`
    - Quản lý state `viewMode: '2D' | '3D'`.
    - Render `Topology2DView` (Existing) hoặc `Topology3DView` (New).
- **File:** `packages/frontend/src/pages/topology/components/TopologyFilterPanel.tsx`
    - Thêm `Segmented` control để đổi view mode.

---

## 4. Danh sách Story Points (Tổng kết)

| Task ID | Nội dung | Points |
|---|---|---|
| S10-01 | [BE] Setup WebSocket Gateway & GraphQL Subscriptions | 8 |
| S10-02 | [BE] Implement Subscription Resolvers & Triggers | 5 |
| S10-03 | [FE] Config Apollo WS Link & Subscriptions | 5 |
| S10-04 | [FE] 3D Base Engine & Layering Logic | 10 |
| S10-05 | [FE] 3D Edges & Interactions (Explode/Highlight) | 8 |
| S10-06 | [FE] View Switcher & Filter Sync | 5 |
| S10-07 | [FE] Realtime Polling Fallback | 5 |
| S10-08 | [INT] Integration Test (WS Flow) | 5 |

**Tổng cộng:** 51 Story Points

---

## 5. Tài liệu tham khảo
- **SRS Section 4.5**: Topology Visualization — 2D & 3D
- **SRS Section 4.5.3**: Realtime với GraphQL Subscription

---

_Kế hoạch được soạn thảo bởi: Antigravity Agent_  
_Ngày cập nhật: 2026-04-17_
