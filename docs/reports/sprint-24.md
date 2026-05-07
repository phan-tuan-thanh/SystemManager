# Sprint 24 — Trực quan hoá Firewall Topology (Vis-Network & Mermaid)

**Ngày bắt đầu:** 2026-05-02  
**Ngày kết thúc:** 2026-05-02  
**Trạng thái:** ✅ DONE  
**PR Link:** (Local)

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Bổ sung engine render `vis-network` cho tab Firewall Topology để đồng nhất trải nghiệm tương tác với App Topology. Cung cấp tính năng xuất sơ đồ dưới dạng mã nguồn `Mermaid` để hỗ trợ nhúng sơ đồ mạng vào các tài liệu nghiệp vụ/kỹ thuật. Giải pháp đảm bảo không làm thay đổi các API Backend hiện tại.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

Phần này định nghĩa cấu trúc dữ liệu Frontend cần parser từ API `/api/v1/firewall-rules`.

#### **Cấu trúc dữ liệu Parser (Vis-Network)**
| Field (VisNode) | Type | Description |
|---|---|---|
| `id` | `String` | ID duy nhất (Prefix `zone-`, `server-`, `ip-`) |
| `label` | `String` | Tên Zone / Hostname |
| `group` | `String` | Xác định CSS/Icon: `zone`, `server`, `ip` |
| `shape` | `String` | Hình dạng (`box` cho Zone, `square` cho Server) |

| Field (VisEdge) | Type | Description |
|---|---|---|
| `id` | `String` | ID của rule |
| `from` | `String` | Node nguồn (Zone/IP ID) |
| `to` | `String` | Node đích (Server ID) |
| `label` | `String` | Hiển thị Port và Protocol (Ví dụ: `TCP 443`) |
| `color` | `Object` | Màu sắc: Xanh (ALLOW) / Đỏ (DENY) / Vàng (PENDING) |
| `dashes` | `Boolean` | Cạnh đứt khúc nếu rule `PENDING_APPROVAL` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Zero-Backend Changes:** Sprint này không yêu cầu thay đổi Backend. Frontend sẽ call API `GET /api/v1/firewall-rules` với filter `environment` hiện tại.

### 3.2. Tầng Frontend (Client-side Logic)
- **Data Parsing Logic (Vis-Network):** 
  - Duyệt qua danh sách `firewallRules`.
  - Extract danh sách các `source_zone`/`source_ip` (tránh trùng lặp bằng Map/Set) để tạo Vis Nodes.
  - Extract danh sách `destination_server` để tạo Vis Nodes.
  - Ánh xạ từng rule thành Vis Edge.
- **Data Parsing Logic (Mermaid Exporter):**
  - Xây dựng mảng chuỗi (array of strings) bắt đầu bằng `graph LR`.
  - Filter escape characters (xoá các ký tự `(`, `)`, `[`, `]` trong tên server/zone).
  - Vòng lặp các rules: `Zone_ID[Zone Name] -- "TCP 80" --> Server_ID[Server Hostname]`
  - Nếu `action` là DENY, thay đổi cú pháp cạnh (ví dụ `-.->`).
  - Style các node dựa trên trạng thái (ALLOW/DENY) nếu cần thiết.
- **UI State Management:** 
  - Đưa Vis-Network Component vào bên trong tab "Firewall" của trang Topology hiện tại.
  - Nút "Export Mermaid" mở một Modal chứa Textarea hiển thị chuỗi Mermaid đã generate kèm nút "Copy to Clipboard".

## 4. Đặc tả API Interfaces

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useFirewallRules(env)` | `GET /api/v1/firewall-rules` | Lấy dữ liệu luật tường lửa để vẽ graph. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Performance Issues:** Nếu API trả về > 1000 rules, `vis-network` có thể bị giật/lag. Giải pháp: Thêm check độ dài array. Nếu rules > 500, cảnh báo người dùng cần chọn Filter (Source Zone / Destination Server) cụ thể trước khi vẽ graph.
- **Empty State:** Nếu không có rules nào trong môi trường hiện tại, hiển thị Empty State ("Không có luật tường lửa nào trong môi trường này") thay vì canvas trắng.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý (Mermaid):** Engine parser của nền tảng web (như GitHub, Confluence) rất nhạy cảm với syntax error. Phải test chuỗi Mermaid sinh ra bằng công cụ Mermaid Live Editor. Khi gán ID cho node trong cú pháp Mermaid, ID không được chứa dấu cách (spaces).
- **Gotchas / Chú ý (Vis-Network):** Khi render `vis-network`, không mutate object state của React trực tiếp mà cần dùng tập dữ liệu riêng rẽ (DataView hoặc cloneDeep) để tránh lỗi vòng lặp cập nhật state liên tục.

---

## 7. Metrics & Tasks

- Story Points: 13
- Tasks: 
  - Xây dựng hàm parser chuyển API response sang định dạng Node/Edge của Vis.
  - Viết thuật toán generate chuỗi Mermaid Graph.
  - Implement Component `FirewallTopologyView`.
  - Tích hợp Modal Copy Mermaid code.

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
