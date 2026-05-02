# Sprint 23 — Network Zone & Firewall Rule Management

**Ngày bắt đầu:** 2026-04-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cung cấp khả năng phân vùng mạng (Network Zones) và quản lý thiết lập tường lửa (Firewall Rules) giữa các vùng/IP. Xây dựng sơ đồ Firewall Topology trực quan để đánh giá rủi ro an ninh mạng, kiểm soát chặt chẽ luồng Ingress/Egress.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Các Table mới/Cập nhật:**
  - `NetworkZone`: Định nghĩa vùng (Name, Type).
  - `ZoneIpEntry`: Các IP hoặc dải mạng (CIDR) nằm trong một Zone.
  - `FirewallRule`: Định nghĩa luồng mạng đi qua firewall. Bao gồm thông tin:
    - `source_type` / `target_type` (ZONE hoặc IP)
    - `source_id` / `target_id` / `source_ip` / `target_ip`
    - `port`, `protocol`, `action` (ALLOW/DENY)
- **Enum Mới:**
  - `NetworkZoneType`: `INTERNAL`, `DMZ`, `EXTERNAL`
  - `FirewallAction`: `ALLOW`, `DENY`
  - `FirewallRuleStatus`: `ACTIVE`, `INACTIVE`
- **Quan hệ (Relations):**
  - `NetworkZone` (1) - (n) `ZoneIpEntry`
  - `FirewallRule` trỏ khoá ngoại tới `NetworkZone` (source hoặc target tuỳ điều kiện).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Logic Validate Firewall Rule
- Khi tạo mới Rule, hệ thống tự động kiểm tra tính hợp lệ:
  - Nếu `source_type === 'ZONE'`, bắt buộc `source_id` phải tồn tại (Fetch từ DB), bỏ qua `source_ip`.
  - Tương tự cho Target.
- Validator class trong backend sẽ validate cú pháp IP/CIDR bằng thư viện regex.

### 3.2. Import/Export Rules (Luồng XLSX)
- Luồng Import hỗ trợ đọc từ file Excel (.xlsx), parse port, protocol và tự động lookup ID của Zone dựa trên tên văn bản.
- Chạy trong DB Transaction: Đảm bảo nếu import 100 dòng mà dòng 99 lỗi thì toàn bộ data bị rollback, không làm ô nhiễm cấu hình tường lửa.

### 3.3. Firewall Topology View
- Giao diện riêng rẽ tách biệt khỏi Application Topology.
- Render đồ thị dựa trên bảng `FirewallRule`. 
- **Quy ước màu:**
  - ALLOW Edge -> Xanh lá (Green), nét liền.
  - DENY Edge -> Đỏ (Red), nét đứt, biểu thị traffic bị drop.

## 4. Đặc tả API Interfaces (Key APIs)

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/network-zones` | `GET/POST/PATCH/DELETE` | `CreateNetworkZoneDto` | Quản lý phân vùng mạng | `OPERATOR` |
| `/network-zones/:id/ips`| `POST` | `{ ips: string[] }` | Thêm IP vào vùng (Bulk) | `OPERATOR` |
| `/firewall-rules/import`| `POST` | Multipart/form-data | Đọc file Excel tạo rules | `OPERATOR` |
| `/firewall-rules/export`| `GET` | N/A | Tải file XLSX | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Loop Firewall Detection (Cảnh báo tĩnh):** Nếu có 2 rule xung đột (Ví dụ Rule 1: ALLOW IP_A tới IP_B; Rule 2: DENY IP_A tới IP_B), API trả về cảnh báo `409 Conflict` yêu cầu admin vô hiệu hoá (INACTIVE) rule cũ trước khi tạo rule mới.
- **Xoá Zone Ràng Buộc:** Không cho phép xoá (Soft Delete) một `NetworkZone` nếu nó đang được tham chiếu làm Source hoặc Target trong một `FirewallRule` đang `ACTIVE`.

## 6. Hướng dẫn Bảo trì & Debug

- Khi debug lỗi không load được biểu đồ Firewall, hãy kiểm tra API export xem có Rule nào trỏ tới một Zone đã bị xoá cứng (Hard delete - điều không được phép xảy ra) gây gãy Foreign Key hay không.

---

## 7. Metrics & Tasks (Lịch sử công việc)

### Danh sách Tasks
- ✅ S23-01: Prisma schema — NetworkZone + ZoneIpEntry + FirewallRule
- ✅ S23-03: NetworkZone module — 9 endpoints: CRUD zone + bulk-import IPs
- ✅ S23-04: FirewallRule module — 7 endpoints: CRUD + import/export XLSX
- ✅ S23-06: FE /network-zones — DataTable + Drawer
- ✅ S23-07: FE /firewall-rules — DataTable + Import Modal + Export
- ✅ S23-08: FirewallTopologyView — ReactFlow (ALLOW/DENY edges)

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì._
