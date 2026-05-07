# Sprint 25 — Two-Layer Connectivity Model: Firewall Coverage & Implied Connections

**Ngày bắt đầu:** 2026-05-08  
**Ngày kết thúc:** (Dự kiến ~7 ngày)  
**Trạng thái:** 📝 PLANNING  
**Branch:** `feat/sprint-25-connectivity-model`

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai mô hình kết nối 2 lớp (xem `docs/IMPLEMENTATION_DETAILS.md` — "Connectivity Model — Two-Layer Design"): AppConnection là tầng Application Dependency, FirewallRule là tầng Network Permission. Hệ thống cross-validate và cảnh báo khi AppConnection thiếu FirewallRule coverage; topology render cả implied connections từ FirewallRule ALLOW active.

**Tài liệu tham chiếu:**
- `docs/SRS.md` — Section 4.5.1 "Mô hình Kết nối 2 Lớp"
- `docs/IMPLEMENTATION_DETAILS.md` — "Connectivity Model — Two-Layer Design"

---

## 2. Đặc tả kỹ thuật

### 2.1. Cross-Validation Logic (AppConnection → FirewallRule)

Với mỗi AppConnection `(source_app_id, target_app_id, target_port_id, environment)`:

```
1. Tìm source servers: AppDeployment WHERE application_id = source_app_id AND environment = env
2. Tìm target server: AppDeployment WHERE application_id = target_app_id AND port IN ports (target_port_id)
3. Tìm source IPs: NetworkConfig WHERE server_id IN source_servers
4. Kiểm tra FirewallRule:
   WHERE destination_server_id = target_server_id
     AND (destination_port_id = target_port_id OR destination_port_id IS NULL)
     AND action = 'ALLOW'
     AND status = 'ACTIVE'
     AND (deleted_at IS NULL)
     AND (
       source_ip IN source_ips
       OR source_zone.zone_ip_entries CONTAIN source_ips (CIDR overlap)
     )
5. Kết quả: COVERED nếu tìm được ≥1 rule | UNCOVERED nếu không có
```

### 2.2. Implied Connections từ FirewallRule

Cho `topology.getImpliedConnections(environment)`:

```
1. Lấy FirewallRules: WHERE action = 'ALLOW' AND status = 'ACTIVE' AND environment = env
2. Mỗi rule:
   a. destination_port → application (qua Port.application_id)
   b. source_zone.zone_ip_entries → IPs → servers (qua NetworkConfig)
   c. Với mỗi source_server: deployments → source apps
   d. Tạo implied edge: source_app → target_app (ref: firewall_rule_id)
3. Loại bỏ implied edge đã có AppConnection tương ứng
4. Trả về list ImpliedConnectionEdge
```

### 2.3. Response schema

```typescript
// Coverage status (computed, không lưu DB)
interface FirewallCoverageResult {
  connection_id: string;
  status: 'COVERED' | 'UNCOVERED' | 'NO_PORT' | 'UNKNOWN';
  covering_rules: { id: string; name: string; status: string }[];
}

// Implied connection edge
interface ImpliedConnectionEdge {
  id: string; // synthetic: `implied-${rule.id}-${source_app_id}-${target_app_id}`
  source_app_id: string;
  target_app_id: string;
  environment: string;
  type: 'IMPLIED';
  firewall_rule_id: string;
  firewall_rule_name: string;
  target_port_id: string;
}
```

---

## 3. Luồng xử lý kỹ thuật

### 3.1. Backend

#### S25-01: ConnectionService.getFirewallCoverageStatus()

File: `packages/backend/src/modules/connection/connection.service.ts`

```typescript
async getFirewallCoverageStatus(connectionId: string): Promise<FirewallCoverageResult>
async getFirewallCoverageStatusBatch(
  environment: string
): Promise<Map<string, FirewallCoverageResult>>
```

Logic:
1. Load AppConnection + target_port + target_app deployments + source_app deployments + network_configs
2. Query FirewallRules với destination match
3. Check source zone IP entries (CIDR containment)
4. Trả về COVERED / UNCOVERED / NO_PORT (target_port_id = null) / UNKNOWN (deployment not found)

#### S25-02: ConnectionController — endpoint mới

```
GET /api/v1/connections/firewall-coverage?environment=PROD  → batch coverage cho env
GET /api/v1/connections/:id/firewall-coverage               → coverage cho 1 connection
```

#### S25-03: TopologyService.getImpliedConnections()

File: `packages/backend/src/modules/topology/topology.service.ts`

```typescript
async getImpliedConnections(environment: string): Promise<ImpliedConnectionEdge[]>
```

Add `impliedConnections` vào topology query response:
```typescript
// TopologyData interface update
interface TopologyData {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  implied_connections: ImpliedConnectionEdge[]; // NEW
}
```

GraphQL resolver cập nhật query `topology` để include `impliedConnections`.

### 3.2. Frontend

#### S25-04: Coverage API hook

File: `packages/frontend/src/api/connections.ts` (update)

```typescript
export function useConnectionFirewallCoverage(environment: string) {
  return useQuery(['connections', 'firewall-coverage', environment], ...)
}
```

#### S25-05: AppConnection List — coverage badge column

File: `packages/frontend/src/pages/connection/` (update)

- Thêm column "Firewall Coverage" vào DataTable
- Badge: `<Tag color="success">✅ Covered</Tag>` | `<Tag color="warning">⚠️ Uncovered</Tag>` | `<Tag color="default">— No Port</Tag>`
- Load batch coverage khi load list page

#### S25-06: App Topology — implied edges + coverage badge

File: `packages/frontend/src/pages/topology/` (update)

**Implied edges (nét đứt):**
```typescript
// Edge style cho IMPLIED connections
const impliedEdgeStyle = {
  strokeDasharray: '5,5',
  stroke: '#91d5ff', // light blue
  opacity: 0.6,
}
```

**Coverage badge trên explicit AppConnection edges:**
- COVERED: viền xanh lá trên edge label
- UNCOVERED: icon ⚠️ + tooltip "Thiếu FirewallRule ALLOW"

**Toggle UI:** nút "Hiện kết nối ngầm định" (ẩn/hiện implied edges) — default: hiện

#### S25-07: FirewallRule detail — AppConnections cross-reference

File: `packages/frontend/src/pages/firewall-rule/` (update)

Trong drawer chi tiết FirewallRule, thêm section:
```
📋 Kết nối ứng dụng dùng rule này (N)
[App A → App B, port 8080/HTTPS]
[App C → App D, port 3306/DB   ]
```

API: `GET /api/v1/connections?firewall_rule_coverage=<rule_id>` hoặc compute FE-side từ connection list.

#### S25-08: Firewall Topology — badge count AppConnections

File: `packages/frontend/src/pages/topology/components/FirewallTopologyView.tsx` (update)

- Mỗi ALLOW edge: hiển thị badge `N connections`
- Hover tooltip: liệt kê AppConnection tên (source_app → target_app)

#### S25-09: App detail page — coverage badge

File: `packages/frontend/src/pages/application/` (update)

Trong tab "Kết nối" của trang chi tiết Application:
- Mỗi upstream/downstream connection: badge coverage (✅/⚠️)

---

## 4. Xử lý lỗi & Edge Cases

- `target_port_id = null` → status `NO_PORT` (không thể validate, không warning)
- App chưa có deployment trong environment → status `UNKNOWN`  
- FirewallRule chưa ACTIVE (PENDING_APPROVAL) → không count là coverage
- Implied connection khi có nhiều source servers → tạo edge cho mỗi source_app (deduplicate)
- CIDR containment check: dùng thư viện `ip-cidr` (đã có) hoặc native Node.js

---

## 5. Tasks

| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S25-01 | `[BE]` | `ConnectionService.getFirewallCoverageStatus()` — cross-validate AppConnection vs FirewallRule | 3 |
| S25-02 | `[BE]` | Thêm 2 endpoints: `GET /api/v1/connections/firewall-coverage` (batch) + `/:id/firewall-coverage` | 2 |
| S25-03 | `[BE]` | `TopologyService.getImpliedConnections()` — suy ra connections từ FirewallRule ALLOW; cập nhật `getTopology()` response + GraphQL resolver | 5 |
| S25-04 | `[FE]` | Hook `useConnectionFirewallCoverage` — fetch batch coverage từ API | 1 |
| S25-05 | `[FE]` | AppConnection list page: thêm column "Firewall Coverage" với badge ✅/⚠️ | 2 |
| S25-06 | `[FE]` | App Topology: implied edges (nét đứt, màu nhạt) + coverage badge ✅/⚠️ trên explicit edges + toggle hiện/ẩn | 5 |
| S25-07 | `[FE]` | FirewallRule detail: section liệt kê AppConnections dùng rule này | 3 |
| S25-08 | `[FE]` | Firewall Topology: badge count AppConnections trên mỗi ALLOW edge | 2 |
| S25-09 | `[FE]` | App detail page: coverage badge ✅/⚠️ trên upstream/downstream connection list | 2 |

**Sprint 25 Total: 25 points**

---

## 6. Definition of Done

- [ ] `tsc --noEmit` — 0 lỗi mới
- [ ] `getFirewallCoverageStatus()` unit test
- [ ] `getImpliedConnections()` unit test
- [ ] Smoke test: batch coverage endpoint trả đúng COVERED/UNCOVERED
- [ ] App Topology hiển thị cả explicit + implied edges đúng style
- [ ] Toggle implied edges hoạt động
- [ ] Coverage badge hiển thị đúng ✅/⚠️ trên connection list

_Kế hoạch tạo: 2026-05-08_
