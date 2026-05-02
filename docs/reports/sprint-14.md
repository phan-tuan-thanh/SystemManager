# Sprint 14 — Sơ đồ Topology & Snapshots

**Ngày bắt đầu:** 2026-05-10  
**Ngày kết thúc:** 2026-05-12  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Trực quan hóa hạ tầng qua sơ đồ Topology 2D/3D và cơ chế lưu trữ bản chụp (Snapshots).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: TopologySnapshot**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `label` | `String` | Tên bản chụp | `VarChar(255)` |
| `payload` | `Json` | Dữ liệu Graph (Nodes/Edges) | `Required` |
| `environment` | `String` | Môi trường | `VarChar(10)` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Snapshot Storage:** Lưu trữ trạng thái đồ thị dưới dạng JSON thô để có thể tái tạo lại giao diện ReactFlow/ThreeJS.

### 3.2. Tầng Frontend (Client-side Logic)
- **Graph Rendering:** Sử dụng **ReactFlow** cho 2D và **React Three Fiber** cho 3D.
- **Snapshot Hook:** Sử dụng hook `useDeployments` hoặc service riêng để save/load snapshot.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/topology-snapshots` | `POST` | Lưu bản chụp sơ đồ | `OPERATOR` |
| `/api/v1/topology-snapshots` | `GET` | Danh sách bản chụp | `VIEWER` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useSaveTopologyMutation()` | `POST /api/v1/topology-snapshots` | Hook lưu trạng thái graph hiện tại. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Payload Too Large:** Cấu hình body-parser của NestJS để chấp nhận JSON graph dung lượng lớn.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Do prefix đặc biệt của SnapshotController, đường dẫn thực tế có thể là `/api/v1/api/v1/topology-snapshots` (Cần lưu ý khi debug network).

---

## 7. Metrics & Tasks

- Story Points: 30
- Tasks: 12 (Graph engine, Snapshot logic, 3D visualization)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
