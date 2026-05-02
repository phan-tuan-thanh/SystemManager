# Sprint 14 — Đồ thị Topology 2D Tương tác

**Ngày bắt đầu:** 2026-05-12  
**Ngày kết thúc:** 2026-05-15  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Trực quan hóa toàn bộ hạ tầng và các mối quan hệ kết nối dưới dạng sơ đồ mạng (Graph) tương tác mạnh mẽ.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: TopologySnapshot**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `label` | `String` | Tên bản chụp (VD: 'Trước nâng cấp') | |
| `environment` | `String` | Môi trường | |
| `payload` | `Json` | Dữ liệu Nodes/Edges tại thời điểm lưu | |

#### **Topology Node JSON Payload**
| Key | Type | Description |
|---|---|---|
| `id` | `String` | Unique ID (Server/App ID) |
| `type` | `String` | `serverNode` / `appNode` |
| `position` | `Object` | Tọa độ {x, y} |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Snapshot Logic)
- **Point-in-time Snapshot:** Hệ thống cho phép chụp lại trạng thái của toàn bộ Graph (vị trí các node, các kết nối hiện hữu). Payload được nén dưới dạng JSON để phục vụ việc xem lại lịch sử kiến trúc hạ tầng mà không bị ảnh hưởng bởi các thay đổi thực tế sau đó.

### 3.2. Tầng Frontend (Graph Engine)
- **ReactFlow Integration:** Sử dụng ReactFlow để render hàng nghìn node với hiệu năng cao.
- **Parallel Edge Spreading:** Thuật toán tự động dàn hàng các mũi tên kết nối (Edges) giữa hai Node nếu có nhiều hơn một giao thức đang chạy đồng thời (VD: cả HTTPS và GRPC).
- **Collision Avoidance:** Cơ chế tự động đẩy các node lân cận ra xa khi một node mới được thêm vào hoặc được kéo thả, đảm bảo sơ đồ luôn thoáng đạt và không bị chồng lấn.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/topology-snapshots` | `POST` | Lưu trạng thái sơ đồ | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (Graph UI, Auto-layout, Snapshot logic, Edge spreading)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
