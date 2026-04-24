# Sprint 13 — Interactive Topology 2D & Networks Layout

**Ngày bắt đầu:** 2026-04-21  
**Ngày kết thúc:** 2026-04-23  
**Sprint Goal:** Nâng cấp Topology 2D với bố cục mạng lưới (Networks Layout), cho phép tương tác trực tiếp tạo/xoá kết nối, kéo nhãn giao thức (draggable edge labels), và tối ưu hóa UI/UX cho canvas đồ họa.  
**Trạng thái:** DONE

---

## Sprint Goal

> Sau Sprint 13, người dùng có thể kéo thả để tạo kết nối giữa các ứng dụng trực tiếp trên sơ đồ 2D, chọn port đích qua popup, kéo nhãn protocol để tránh chồng lấp, và xem sơ đồ dưới dạng bố cục "Networks" (Server Box chứa các App Nodes). Mọi thay đổi về vị trí node do người dùng kéo thả sẽ được bảo toàn sau khi refetch dữ liệu.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S13-01 | `[BE]` Thêm `target_port_id` vào `AppConnection` Prisma schema, tạo migration | 3 | ✅ |
| S13-02 | `[BE]` Cập nhật DTO `CreateConnectionDto`, `UpdateConnectionDto` & `ConnectionService` | 3 | ✅ |
| S13-03 | `[BE]` GraphQL: Bổ sung entity `targetPort` vào `TopologyConnection` | 2 | ✅ |
| S13-04 | `[FE]` Thêm `CreateConnectionModal` để xử lý form tạo Edge. Logic: Tự động kết nối nếu 1 port | 5 | ✅ |
| S13-05 | `[FE]` Xử lý `onConnect` event và `onEdgeClick` (xoá kết nối) trong `ReactFlow` + Draft Interceptor | 5 | ✅ |
| S13-06 | `[FE]` Cấu hình Layout "Networks" (Server Box cho AppNodes) | 5 | ✅ |
| S13-07 | `[FE]` Auto Arrange → fitView: dùng `requestAnimationFrame` x2, xoá userPositions | 1 | ✅ |
| S13-08 | `[FE]` Draggable edge labels: kéo nhãn protocol để tránh chồng lấp | 3 | ✅ |
| S13-09 | `[FE]` Drag/drop node position preservation: giữ vị trí node sau khi refetch | 2 | ✅ |
| S13-10 | `[FE]` Fullscreen button cho canvas 2D | 1 | ✅ |

**Planned Velocity:** 30 points  
**Actual Velocity:** 30 points

---

## Thành phần đã triển khai

### Backend (Prisma & GraphQL)

#### S13-01+02+03 — Connection Target Port Support
- **Prisma Schema**: Trường `target_port_id` đã được bổ sung vào model `AppConnection` (Migration `20260421000000_add_change_items` và các migrations liên quan).
- **DTOs**: `CreateConnectionDto` và `UpdateConnectionDto` hỗ trợ `target_port_id` (IsUUID, IsOptional).
- **GraphQL**: `ConnectionEdge` entity trong `TopologyModule` đã có field `targetPort` (ObjectType `PortNode`), cho phép FE truy vấn thông tin port đích của kết nối.
- **Service**: `TopologyService` và `ConnectionService` đã cập nhật logic `include` để lấy thông tin `target_port`.

### Frontend (Interactive Topology)

#### S13-04 — CreateConnectionModal
- Thành phần mới hỗ trợ chọn port đích khi tạo kết nối giữa hai ứng dụng.
- **Logic thông minh**: Nếu ứng dụng đích chỉ có 1 port, hệ thống tự động chọn và tạo kết nối ngay lập tức. Nếu có nhiều port, hiển thị Modal để người dùng chọn.

#### S13-05 — Interactive Connection Management
- **React Flow Integration**: Xử lý sự kiện `onConnect` để kích hoạt quy trình tạo kết nối.
- **Connection Deletion**: Tích hợp `onEdgeClick` hiển thị `ConnectionDetailPanel` với nút Xoá kết nối (Popconfirm), hỗ trợ cả trạng thái đang xoá (pending).

#### S13-06 — Networks Layout (Server Boxes)
- Nâng cấp `ReactFlow` canvas để hỗ trợ "nested nodes".
- Các ứng dụng (App Nodes) được hiển thị bên trong các nhóm máy chủ (Server Boxes), giúp phân tách rõ ràng hạ tầng vật lý và logic ứng dụng.

#### S13-08 — Draggable Edge Labels
- Custom `ProtocolEdge` component cho phép người dùng kéo thả nhãn giao thức (HTTP, HTTPS, TCP...) đến vị trí mong muốn để tránh bị che khuất bởi các kết nối khác.
- Lưu trữ `labelOffset` trong dữ liệu của edge.

#### S13-09 — Position Preservation
- Sử dụng `userPositionsRef` để theo dõi các thay đổi tọa độ do người dùng thực hiện.
- Đảm bảo các node không bị reset về vị trí mặc định sau khi dữ liệu Topology được làm mới từ API.

#### S13-10 — Fullscreen API
- Nút "Fullscreen" tích hợp vào thanh toolbar của Topology, cho phép mở rộng canvas ra toàn màn hình để quan sát các hệ thống phức tạp.

---

## Achievements

- [x] Tương tác tạo/xoá kết nối trực tiếp trên sơ đồ 2D (Drag-to-connect).
- [x] Bố cục "Networks" chuyên nghiệp với lồng ghép Server/App.
- [x] Nhãn kết nối có thể di chuyển (Draggable labels).
- [x] Bảo toàn vị trí node sau khi cập nhật dữ liệu.
- [x] Tích hợp đầy đủ thông tin Port đích vào sơ đồ.
- [x] Chế độ toàn màn hình (Fullscreen) mượt mà.
- [x] 30/30 story points hoàn thành.

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 30 | 30 |
| Tasks Completed | 10 | 10 |
| Tasks Carried Over | — | 0 |
| New Files Created | — | 4 |
| Files Modified | — | 6 |

---

## Retrospective

### What went well
- Logic tự động chọn port (nếu chỉ có 1) giúp giảm thiểu thao tác của người dùng đáng kể.
- `userPositionsRef` giải quyết triệt để vấn đề UI bị "nhảy" vị trí khi dữ liệu realtime được cập nhật.
- Draggable labels là một tính năng nhỏ nhưng mang lại giá trị cao trong việc tối ưu hóa khả năng đọc sơ đồ.

### What could be improved
- Thuật toán Auto Arrange hiện tại (Dagre/Force) đôi khi tạo ra các đường chéo đè lên Server Box; có thể cân nhắc thuật toán Orthogonal routing trong tương lai.
- Việc quản lý nested nodes trong React Flow cần tính toán kích thước Server Box động khi số lượng App Nodes thay đổi.

---

## Next Steps
- **Dự án đạt trạng thái COMPLETE cho Roadmap hiện tại.**
- Chuyển sang giai đoạn bảo trì, tối ưu hiệu năng render khi số lượng node > 500.
- Chuẩn bị tài liệu hướng dẫn vận hành (Operator Manual).

---

_Report tạo bởi: Antigravity AI Agent_  
_Cập nhật lần cuối: 2026-04-23_
