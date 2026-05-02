# Sprint 23 — Network Zone & Firewall Rule Management

**Mục tiêu:** Phân vùng mạng (NetworkZone), quản lý firewall rule (CRUD/import/export XLSX) và topology phân vùng mạng thể hiện kết nối IP→server:port.

**Branch:** `feat/sprint-23-network-zone-firewall`
**Plan created:** 2026-04-30

---

## 1. [BE] Prisma Schema — NetworkZone, ZoneIpEntry, FirewallRule *(added 2026-04-30)*

**Yêu cầu:** Bổ sung 3 model + 3 enum mới vào schema Prisma.
**Story points:** 3

### Thành phần Backend
- **Models mới:** `NetworkZone`, `ZoneIpEntry`, `FirewallRule`
- **Enums mới:** `NetworkZoneType`, `FirewallAction`, `FirewallRuleStatus`
- **Relations:** FirewallRule → Server, FirewallRule → Port, FirewallRule → NetworkZone (src/dst), ZoneIpEntry → NetworkZone

### Files thay đổi
- `packages/backend/prisma/schema.prisma` — update (S23-01)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-01 | `[BE]` | Prisma schema: NetworkZone + ZoneIpEntry + FirewallRule + 3 enums | 3 |

---

## 2. [BE] Prisma Migration *(added 2026-04-30)*

**Story points:** 1

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-02 | `[BE]` | Migration: add_network_zone_firewall_rule | 1 |

---

## 3. [BE] NetworkZone Module *(added 2026-04-30)*

**Yêu cầu:** CRUD cho NetworkZone + quản lý ZoneIpEntry (add/remove/import bulk).
**Story points:** 3

### Thành phần Backend
- **Module:** `packages/backend/src/modules/network-zone/`
- **API endpoints mới:**
  - `GET /api/v1/network-zones` — list zones (filter by environment)
  - `POST /api/v1/network-zones` — create zone
  - `GET /api/v1/network-zones/:id` — get zone detail
  - `PATCH /api/v1/network-zones/:id` — update zone
  - `DELETE /api/v1/network-zones/:id` — soft delete zone
  - `GET /api/v1/network-zones/:id/ips` — list IPs of zone
  - `POST /api/v1/network-zones/:id/ips` — add IP to zone
  - `POST /api/v1/network-zones/:id/ips/bulk` — bulk import IPs (text list)
  - `DELETE /api/v1/network-zones/:zoneId/ips/:ipId` — remove IP

### Files thay đổi
- `packages/backend/src/modules/network-zone/network-zone.module.ts` — new
- `packages/backend/src/modules/network-zone/network-zone.controller.ts` — new
- `packages/backend/src/modules/network-zone/network-zone.service.ts` — new
- `packages/backend/src/modules/network-zone/dto/` — new (3 DTOs)
- `packages/backend/src/modules/network-zone/entities/` — new

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-03 | `[BE]` | NetworkZone module: CRUD zone + ZoneIpEntry management | 3 |

---

## 4. [BE] FirewallRule Module *(added 2026-04-30)*

**Yêu cầu:** CRUD rule + import CSV/XLSX + export XLSX tài liệu rule request.
**Story points:** 5

### Thành phần Backend
- **Module:** `packages/backend/src/modules/firewall-rule/`
- **API endpoints mới:**
  - `GET /api/v1/firewall-rules` — list rules (filter + pagination)
  - `POST /api/v1/firewall-rules` — create rule
  - `GET /api/v1/firewall-rules/:id` — get rule detail
  - `PATCH /api/v1/firewall-rules/:id` — update rule
  - `DELETE /api/v1/firewall-rules/:id` — soft delete
  - `POST /api/v1/firewall-rules/import` — import từ CSV/XLSX file
  - `GET /api/v1/firewall-rules/export` — export XLSX rule request document

### Files thay đổi
- `packages/backend/src/modules/firewall-rule/` — new module (controller, service, dto, entities)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-04 | `[BE]` | FirewallRule CRUD + import CSV/XLSX + export XLSX | 5 |

---

## 5. [BE] Register Modules in app.module.ts *(added 2026-04-30)*

**Story points:** 1

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-05 | `[BE]` | Đăng ký NetworkZoneModule + FirewallRuleModule vào AppModule | 1 |

---

## 6. [FE] NetworkZone Management Page *(added 2026-04-30)*

**Yêu cầu:** Trang `/network-zones` — list/create/edit zone + manage IP entries.
**Story points:** 5

### Thành phần Frontend
- **Route:** `/network-zones`
- **Page:** `packages/frontend/src/pages/network-zone/`
- **Components:** ZoneList, ZoneForm, ZoneIpTable, ZoneIpBulkImportModal
- **Hooks:** `useNetworkZones.ts`

### Files thay đổi
- `packages/frontend/src/pages/network-zone/index.tsx` — new
- `packages/frontend/src/pages/network-zone/components/ZoneForm.tsx` — new
- `packages/frontend/src/pages/network-zone/components/ZoneIpDrawer.tsx` — new
- `packages/frontend/src/pages/network-zone/hooks/useNetworkZones.ts` — new
- `packages/frontend/src/types/network-zone.ts` — new

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-06 | `[FE]` | NetworkZone page: list zones + IP management drawer | 5 |

---

## 7. [FE] FirewallRule Management Page *(added 2026-04-30)*

**Yêu cầu:** Trang `/firewall-rules` — list/create/edit rule + import CSV + export XLSX.
**Story points:** 5

### Thành phần Frontend
- **Route:** `/firewall-rules`
- **Page:** `packages/frontend/src/pages/firewall-rule/`
- **Hooks:** `useFirewallRules.ts`

### Files thay đổi
- `packages/frontend/src/pages/firewall-rule/index.tsx` — new
- `packages/frontend/src/pages/firewall-rule/components/FirewallRuleForm.tsx` — new
- `packages/frontend/src/pages/firewall-rule/components/FirewallRuleImportModal.tsx` — new
- `packages/frontend/src/pages/firewall-rule/hooks/useFirewallRules.ts` — new
- `packages/frontend/src/types/firewall-rule.ts` — new

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-07 | `[FE]` | FirewallRule page: list + form + import + export XLSX | 5 |

---

## 8. [FE] Firewall Topology View *(added 2026-04-30)*

**Yêu cầu:** Tab "Firewall" trong trang Topology thể hiện zone→server:port graph từ firewall rules.
**Story points:** 5

### Thành phần Frontend
- **Tab mới** trong `packages/frontend/src/pages/topology/index.tsx`
- **Component mới:** `FirewallTopologyView.tsx` — dùng ReactFlow
- **Node types:** ZoneNode (màu zone), ServerPortNode
- **Edge:** ALLOW=xanh, DENY=đỏ, tooltip rule details

### Files thay đổi
- `packages/frontend/src/pages/topology/index.tsx` — thêm tab "Firewall" (update)
- `packages/frontend/src/pages/topology/components/FirewallTopologyView.tsx` — new
- `packages/frontend/src/pages/topology/components/ZoneNode.tsx` — new
- `packages/frontend/src/pages/topology/components/ServerPortNode.tsx` — new

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-08 | `[FE]` | FirewallTopologyView: ReactFlow graph zone→server:port từ firewall rules | 5 |

---

## 9. [FE] Routes + Sidebar Menu *(added 2026-04-30)*

**Story points:** 1

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S23-09 | `[FE]` | Routes + Sidebar: /network-zones + /firewall-rules | 1 |

---

## Tổng Sprint 23: 29 points

| Task | Points | Status |
|------|--------|--------|
| S23-01 | 3 | ✅ |
| S23-02 | 1 | ✅ |
| S23-03 | 3 | ✅ |
| S23-04 | 5 | ✅ |
| S23-05 | 1 | ✅ |
| S23-06 | 5 | ✅ |
| S23-07 | 5 | ✅ |
| S23-08 | 5 | ✅ |
| S23-09 | 1 | ✅ |
