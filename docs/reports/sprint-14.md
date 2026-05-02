# Sprint 14 — Initial Topology Graph (ReactFlow)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Phiên bản thử nghiệm đầu tiên của sơ đồ mạng (Topology) sử dụng ReactFlow.

## 3. Luồng xử lý kỹ thuật & Business Logic
- Sử dụng `dagre` engine để tự động xếp toạ độ (layout) các node tĩnh từ trên xuống dưới (TB).
- Parse từ dữ liệu `AppConnection` thành cấu trúc `Nodes` và `Edges` của ReactFlow.
- Custom Node UI cho Server (box to) và App (box nhỏ bên trong).

---
## 7. Metrics & Tasks
_Vẽ được graph cơ bản bằng Dagre._
