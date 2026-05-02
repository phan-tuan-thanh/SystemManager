# Sprint 08 — Quản lý Kết nối & Port Mapping

**Ngày bắt đầu:** 2026-04-25  
**Ngày kết thúc:** 2026-04-27  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý chi tiết các cổng dịch vụ (Ports) và luồng giao tiếp (Connections) giữa các ứng dụng.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Port**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `port_number` | `Int` | Số cổng | `Required` |
| `protocol` | `String` | Giao thức | Default: `TCP` |

#### **Model / DTO: AppConnection**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `source_app_id` | `UUID` | App gọi | Foreign Key |
| `target_app_id` | `UUID` | App nhận | Foreign Key |
| `connection_type` | `Enum` | Chuẩn kết nối | `HTTP`, `HTTPS`, `TCP`, `GRPC`, `AMQP`, `KAFKA`, `DATABASE` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Port Conflict:** Một Port trên cùng 1 Server và Giao thức không được phép trùng lặp giữa các ứng dụng khác nhau.
- **Dependency API:** API trả về danh sách các ứng dụng phụ thuộc (Upstream/Downstream).

### 3.2. Tầng Frontend (Client-side Logic)
- **Connection Hook:** Quản lý thông qua hook `useConnections`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/ports` | `POST` | Khai báo port | `OPERATOR` |
| `/api/v1/connections` | `POST` | Khai báo kết nối | `OPERATOR` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useConnections()` | `POST /api/v1/connections` | Hook quản lý luồng dữ liệu app-to-app. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Port in Use (Lỗi 409):** Cổng đã được đăng ký bởi ứng dụng khác trên Server này.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi xoá một Deployment, các kết nối đi kèm sẽ bị chuyển trạng thái không hiển thị trừ khi chọn query bao gồm `deleted`.

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (Port Schema, Connection logic, Dependency UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
