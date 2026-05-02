# Sprint 03 — Quản lý Module & Feature Toggle

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-11  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý bật/tắt các phân hệ chức năng (Modules) của hệ thống kèm theo ràng buộc phụ thuộc (Dependencies).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ModuleConfig**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `module_key` | `String` | Khóa định danh | `Unique`, `VarChar(50)` |
| `module_type` | `Enum` | Phân loại | `CORE` (Không thể tắt), `EXTENDED` |
| `status` | `Enum` | Trạng thái | `ENABLED`, `DISABLED` |
| `dependencies` | `String[]` | Danh sách key phụ thuộc | Array of strings |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Module Guard:** Sử dụng decorator `@RequireModule('KEY')` kết hợp với `ModuleGuard` để chặn truy cập API của các module đang ở trạng thái `DISABLED`.
- **Toggle Constraints:**
  - Không cho phép tắt module loại `CORE`.
  - Khi tắt: Kiểm tra xem có module nào đang `ENABLED` mà phụ thuộc vào module này không.
  - Khi bật: Kiểm tra tất cả các dependencies của nó đã được `ENABLED` chưa.

### 3.2. Tầng Frontend (Client-side Logic)
- **Dynamic Sidebar:** Hook `useModuleConfigs` fetch danh sách module để ẩn/hiện các menu item tương ứng trên giao diện.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/module-configs` | `GET` | Lấy danh sách cấu hình module | `VIEWER` |
| `/api/v1/module-configs/:key/toggle` | `PATCH` | Bật/tắt module | `ADMIN` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useModuleConfigs()` | `GET /api/v1/module-configs` | Hook fetch danh sách cấu hình. |
| `useToggleModuleMutation()` | `PATCH /api/v1/module-configs/:key/toggle` | Mutation thay đổi trạng thái module. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Dependency Violation (Lỗi 400):** Trả về thông báo chi tiết danh sách các module đang gây cản trở việc bật/tắt.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi thêm Module mới, cần khai báo chính xác `module_key` trong Database để `ModuleGuard` có thể truy vấn.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (Module Schema, Toggle logic, Guard implementation)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
