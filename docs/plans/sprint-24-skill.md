# Developer Skill (Instruction Prompt) cho Sprint 24 — Firewall Topology Vis-Network & Mermaid

**Mục đích:** Cung cấp context và prompt hướng dẫn chi tiết dành cho Agent (hoặc Developer) để lập trình tính năng trực quan hoá Firewall Topology bằng Vis-Network và xuất Mermaid Graph.

Bạn có thể cấp tài liệu này làm prompt/input cho các AI Agent hoặc gửi cho lập trình viên để bắt tay vào code.

---

## 🎯 1. Bối cảnh & Yêu cầu (Context & Requirements)
- **Nhiệm vụ:** Tích hợp engine `vis-network` vào tab Firewall Topology và hỗ trợ xuất biểu đồ ra đoạn text dạng `Mermaid`.
- **Backend:** Không cần sửa Backend. Dữ liệu đã có sẵn từ API: `GET /api/v1/firewall-rules` (hỗ trợ filter theo `environment`).
- **Tài liệu tham khảo bắt buộc:** Yêu cầu đọc kỹ `docs/reports/sprint-24.md` trước khi code để nắm rõ cấu trúc dữ liệu cần parse.

## 📁 2. Các file mục tiêu (Target Files to Create/Modify)
Dự kiến bạn sẽ cần thao tác trên các file Frontend (React/TypeScript) sau:
1.  `packages/frontend/src/pages/topology/TopologyPage.tsx` (Thêm tab/giao diện Firewall Topology nếu chưa có).
2.  `packages/frontend/src/components/topology/FirewallTopologyView.tsx` (**NEW** - Component chính chứa vis-network canvas).
3.  `packages/frontend/src/components/topology/MermaidExportModal.tsx` (**NEW** - Modal chứa text area mã Mermaid và nút Copy).
4.  `packages/frontend/src/services/firewall.service.ts` (Thêm hàm gọi API `/api/v1/firewall-rules` nếu chưa có).
5.  `packages/frontend/src/utils/topology-parser.ts` (Thêm các utility function để parse API response sang Nodes/Edges cho Vis-Network và chuỗi text cho Mermaid).

## 🛠️ 3. Hướng dẫn Từng bước (Step-by-Step Implementation Guide)

### Bước 1: Gọi dữ liệu (Data Fetching)
- Sử dụng TanStack Query (React Query) hoặc `axios` fetch data từ `/api/v1/firewall-rules` kèm param `environment` hiện tại.
- Xử lý trạng thái Loading và Error.
- **Empty State:** Nếu `firewallRules.length === 0`, render giao diện "Không có luật tường lửa nào".

### Bước 2: Viết logic Parse dữ liệu (Data Parsing)
-   **Đối với Vis-Network:**
    -   Viết hàm `parseFirewallToVis(rules)` trả về object `{ nodes: [], edges: [] }`.
    -   **Nodes:** Lọc các `source_zone`, `source_ip` (dùng `Set` để loại bỏ trùng lặp). Đặt `shape: 'box'` cho Zone, `shape: 'square'` cho Server. Đặt `group` rõ ràng để tiện CSS (ví dụ `group: 'zone'`).
    -   **Edges:** Ánh xạ từ các rule. Edge phải có `label` là port/protocol. Màu `color` xanh lá cho `ALLOW`, đỏ cho `DENY`. Thêm thuộc tính `dashes: true` nếu `status === 'PENDING_APPROVAL'`.

-   **Đối với Mermaid:**
    -   Viết hàm `parseFirewallToMermaid(rules)` trả về một chuỗi string.
    -   Bắt đầu với `graph LR`.
    -   Xử lý Escape: Dùng RegEx để xoá bỏ các ký tự `(`, `)`, `[`, `]`, `{`, `}` ra khỏi tên (ID) của Node trong Mermaid để tránh lỗi syntax error.
    -   Ví dụ output: 
        ```
        graph LR
        ZONE_DMZ[Zone DMZ] -- "TCP 443" --> SERVER_WEB1(Web Server 01)
        ```

### Bước 3: Render Vis-Network Canvas
- Import và sử dụng instance `vis-network` trên component `FirewallTopologyView`.
- Tránh mutate state React trực tiếp khi gắn dữ liệu cho Network instance (Khuyến nghị dùng thư viện `react-graph-vis` hoặc tạo hook `useEffect` gắn vanilla `vis-network` vào một `useRef` `div`).
- Thiết lập layout `hierarchical` tự động hoặc `force-directed` cấu hình physics nhẹ.
- **Edge case hiệu năng:** Nếu rules > 500, có thể tắt bớt physics để chống giật lag.

### Bước 4: Xây dựng UI Export Mermaid
- Tạo một Button "Export Mermaid" trên Toolbar của Topology.
- Khi bấm, hiển thị `MermaidExportModal`. Trong Modal có component `textarea` hiển thị chuỗi kết quả từ hàm parse ở Bước 2.
- Gắn nút "Copy to Clipboard" sử dụng `navigator.clipboard.writeText`.

## ⚠️ 4. Các Lưu ý Quan trọng (Gotchas & Constraints)
1.  **Unique ID Node:** Đảm bảo khi tạo Node (cho cả Vis và Mermaid), ID không bị trùng giữa Zone và Server (Ví dụ thêm prefix: `zone-${id}`, `server-${id}`).
2.  **Mermaid Syntax:** Parser Mermaid trên một số web cực kỳ nghiêm ngặt. Phải chắc chắn ID của node Mermaid **không chứa dấu cách** và các ký tự đặc biệt. Hãy dùng string ID an toàn (vd: viết liền không dấu) nhưng label thì có thể chứa khoảng trắng.
3.  **Tái sử dụng (Reusability):** Hãy check xem trong folder `components/topology/` đã có Component render Vis-Network nào chưa (vì App Topology có thể đang dùng chung). Nếu có, hãy tìm cách tái sử dụng component đó và chỉ truyền `data` cùng `options` vào.

---
*Gợi ý lệnh gọi Agent (Command Prompt):* 
> "Đọc file `docs/plans/skill-sprint-24.md` và `docs/reports/sprint-24.md` làm context, sau đó implement toàn bộ luồng Frontend cho Firewall Topology bằng React, bắt đầu từ việc tạo Parser Utils và FirewallTopologyView Component."
