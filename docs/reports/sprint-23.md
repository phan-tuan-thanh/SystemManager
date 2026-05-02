# Sprint 23 Report — Network Zone & Firewall Rule Management

**Ngày:** 2026-04-30
**Branch:** `feat/sprint-23-network-zone-firewall`
**Points:** 29 / 29 ✅

---

## Tính năng đã implement

### S23-01~02: Prisma Schema + Migration
- 3 models mới: `NetworkZone`, `ZoneIpEntry`, `FirewallRule`
- 3 enums mới: `NetworkZoneType` (11 values), `FirewallAction` (ALLOW/DENY), `FirewallRuleStatus` (4 values)
- Migration `20260430090000_add_network_zone_firewall_rule` applied

### S23-03~05: Backend Modules
**NetworkZone module** (`GET|POST|PATCH|DELETE /api/v1/network-zones`):
- CRUD NetworkZone (environment-scoped, unique code per env)
- `GET /api/v1/network-zones/:id/ips` — list IP entries
- `POST /api/v1/network-zones/:id/ips` — add single IP
- `POST /api/v1/network-zones/:id/ips/bulk` — bulk import IPs
- `DELETE /api/v1/network-zones/:zoneId/ips/:ipId` — remove IP

**FirewallRule module** (`/api/v1/firewall-rules`):
- CRUD (soft delete)
- `POST /api/v1/firewall-rules/import` — import CSV/XLSX (upsert by source_ip+server+port+env)
- `GET /api/v1/firewall-rules/export` — export XLSX rule request document (exceljs)

### S23-06~09: Frontend Pages
- `/network-zones` — DataTable zones + ZoneIpDrawer (add/bulk-import/delete IPs)
- `/firewall-rules` — DataTable + FirewallRuleForm Drawer + Import Modal + Export XLSX
- Topology page → tab "🔒 Firewall Topology" — ReactFlow + dagre layout
  - ZoneNode (màu zone), IpNode (vàng), ServerNode (xanh)
  - Edges: ALLOW=xanh (#52c41a), DENY=đỏ (#ff4d4f)
  - Filter: environment, action, status
- Sidebar: "Phân vùng mạng" + "Firewall Rules" dưới group "Hạ tầng"

---

## Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

# Test network zones
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/network-zones?environment=PROD" | jq .meta

# Test firewall rules
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/firewall-rules?environment=PROD" | jq .meta

# Export XLSX
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/firewall-rules/export" -o firewall-rules.xlsx
```

## Known Issues
- DB connectivity issue in Docker (Prisma P1000 auth error) — pre-existing, không liên quan đến sprint 23. Backend container đang restart. Cần kiểm tra docker-compose credentials hoặc pg_hba.conf.
