# Sprint 14 — Đồ thị Topology 2D Tương tác

**Ngày bắt đầu:** 2026-05-12  
**Ngày kết thúc:** 2026-05-15  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Trực quan hóa cấu trúc liên kết mạng và máy chủ dưới dạng sơ đồ đồ thị (Graph) tương tác 2D. Cho phép lưu lại các "Bản chụp" (Snapshots) để theo dõi lịch sử kiến trúc.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: TopologySnapshot**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `label` | `String` | Tên bản chụp định danh | `VarChar(255)` |
| `environment` | `String` | Môi trường | `PROD`, `UAT`, `DEV` |
| `payload` | `Json` | Dữ liệu Nodes/Edges | Định dạng JSON thô |

#### **Hằng số & Enums (Constants & Options)**
- `NodeType`: Loại đối tượng trên bản đồ (`serverNode`, `appNode`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Snapshot Storage Logic:** Dữ liệu topology rất linh động và không cần query phân tích sâu bằng DB, do đó Backend lưu trữ trực tiếp mảng Nodes và Edges của Frontend vào trường `payload` dạng JSONB.

### 3.2. Tầng Frontend (Client-side Logic)
- **ReactFlow Engine:** Sử dụng thư viện ReactFlow để vẽ các Node. Tối ưu performance bằng cách tắt animation khi số lượng Node > 500.
- **Parallel Edge Spreading Algorithm:** Khi có nhiều luồng kết nối (Edges) giữa hai Node (Ví dụ App gọi tới DB qua 3 cổng khác nhau), thuật toán sẽ cấp phát một `offset` tính toán dựa trên góc vẽ, để các mũi tên tản ra, không bị vẽ chồng đè lên nhau.
- **Auto Layout (Dagre/ELK):** Tích hợp thư viện ELKjs để tự động xếp gọn các Node theo hình dạng Cây phân cấp (Hierarchical Tree) dựa trên luồng upstream/downstream thay vì xếp random.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/topology-snapshots` | `POST` | Lưu trạng thái hiện tại thành snapshot | `OPERATOR` |
| `/api/v1/topology-snapshots/:id` | `GET` | Load lại bản chụp lên màn hình | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Canvas Overflow:** Render hơn 2000 Nodes có thể gây giật lag trình duyệt. UI cảnh báo khi tải bản chụp lớn và tự động tắt chế độ `FitView` animation.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi viết Custom Node Component cho ReactFlow, bắt buộc phải dùng thuộc tính `memo` của React để tránh Re-render hàng loạt mỗi khi kéo thả chuột.

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (Graph UI, Auto-layout, Snapshot logic, Edge spreading)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
