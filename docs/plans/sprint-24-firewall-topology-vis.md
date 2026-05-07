# Sprint 24 — Trực quan hoá Firewall Topology với Vis-Network & Mermaid

**Ngày bắt đầu:** (Dự kiến)  
**Ngày kết thúc:** (Dự kiến)  
**Trạng thái:** 📝 PLANNING  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Bổ sung engine render `vis-network` cho tab Firewall Topology để đồng nhất trải nghiệm tương tác (zoom, pan, drag nodes) với App Topology, đồng thời hỗ trợ xuất đồ thị ra định dạng mã nguồn `Mermaid` để nhúng vào tài liệu kỹ thuật.

## 2. Đặc tả các trường dữ liệu & Cấu trúc

### 2.1. Cấu trúc Graph Data (Vis-Network)
*   **Nodes**: Bao gồm 3 loại chính:
    *   `Zone`: Đại diện cho các phân vùng mạng (ví dụ: DMZ, LAN, DB).
    *   `Server`: Máy chủ vật lý hoặc ảo hoá.
    *   `Port`: Badge hoặc node con đính kèm vào Server.
*   **Edges**:
    *   Rule `ALLOW`: Đường nối màu xanh lá (Green).
    *   Rule `DENY`: Đường nối màu đỏ (Red).
    *   Tooltip: Hiển thị Protocol, Port đích, Trạng thái (ACTIVE/PENDING_APPROVAL).

### 2.2. Định dạng Mermaid Graph
*   Sử dụng cú pháp `graph LR` (hoặc `TD`).
*   Các node được định nghĩa với hình dạng phù hợp (ví dụ: Zone `[ ]`, Server `( )`).
*   Các edge đi kèm text label mô tả cổng và giao thức (ví dụ: `-->|TCP 443|`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Frontend (Client-side Logic)
*   **VisNetworkFirewall Component**: 
    *   Nhận dữ liệu từ API `/api/v1/firewall-rules`.
    *   Sử dụng thư viện `vis-network` (đang có sẵn từ Sprint 08/14) để cấu hình layout `hierarchical` hoặc `force-directed` phù hợp với mạng lưới Firewall.
    *   Tối ưu hiệu năng khi số lượng rule lên đến hàng trăm (cluster nodes nếu cần thiết).
*   **MermaidExporter Component**:
    *   Hàm parse danh sách `FirewallRule` sang chuỗi text `Mermaid`.
    *   Nút bấm "Export Mermaid" lưu vào Clipboard hoặc xuất ra file `.txt` / `.md`.

### 3.2. Tầng Backend (Nếu có)
*   Hiện tại không yêu cầu thay đổi API do dữ liệu từ `/api/v1/firewall-rules` đã đủ cung cấp metadata.

## 4. Xử lý Lỗi & Ngoại lệ

*   **Hiệu năng Graph quá lớn**: Cảnh báo người dùng sử dụng bộ lọc (Filter) nếu tập luật quá dày đặc (hơn 500 edges) trước khi render vis-network hoặc xuất Mermaid để tránh đứng trình duyệt.

## 5. Hướng dẫn Bảo trì & Debug

*   **Gotchas / Chú ý**: Mermaid parser rất nhạy cảm với các ký tự đặc biệt trong nhãn node (như `(`, `)`, `{`, `}`, `[` , `]`). Phải escape hoặc filter các ký tự này khi generate chuỗi Mermaid.

---

## 6. Metrics & Tasks

- Story Points: 13
- Tasks:
  1. Parse dữ liệu `/firewall-rules` sang định dạng `nodes` và `edges` của `vis-network`.
  2. Implement `VisNetworkFirewall` component với các tuỳ chỉnh CSS (nodes/edges color dựa theo Rule Action).
  3. Xây dựng hàm parser text cho `Mermaid`.
  4. Thêm nút Export to Mermaid và tính năng Copy to Clipboard.
  5. Xử lý Escape characters an toàn cho Mermaid labels.

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
