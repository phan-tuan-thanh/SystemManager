# Sprint 03 — Quản lý Module & Feature Toggle

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-11  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai cơ chế kiểm soát tính năng (Feature Toggle) thông qua cấu hình ModuleConfig, cho phép Bật/Tắt các phân hệ chức năng động mà không cần deploy lại code.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ModuleConfig**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `module_key` | `String` | Khoá định danh (VD: 'SERVER_MGMT') | `Unique`, `VarChar(50)` |
| `module_type` | `Enum` | Loại module | `CORE` / `EXTENDED` |
| `status` | `Enum` | Trạng thái hoạt động | `ENABLED`, `DISABLED` |
| `dependencies` | `String[]` | Danh sách module phụ thuộc | Mảng chứa các `module_key` |

#### **Hằng số & Enums (Constants & Options)**
- `ModuleType.CORE`: Các module cốt lõi (User, Auth) không bao giờ được phép tắt.
- `ModuleType.EXTENDED`: Các module mở rộng (Hardware, Topology) có thể bật/tắt.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **ModuleGuard Logic:** Guard tuỳ chỉnh `@RequireModule('KEY')`. Guard sẽ intercept request, lấy key từ metadata, kiểm tra bảng `ModuleConfig`. Nếu status = `DISABLED`, từ chối truy cập.
- **Dependency Validation:** Logic đệ quy (Recursive) trong `toggleModule` service. Nếu bật module A (phụ thuộc B), hệ thống kiểm tra B phải đang `ENABLED`. Nếu tắt module A (C đang phụ thuộc A), hệ thống chặn lại và yêu cầu tắt C trước.

### 3.2. Tầng Frontend (Client-side Logic)
- **Module Console UI:** Giao diện dạng Card (Thẻ), chia làm 2 khu vực: CORE Modules (disabled nút tắt) và EXTENDED Modules.
- **Dependency Alert Modal:** Khi người dùng click Toggle nhưng vi phạm quy tắc Dependency, Frontend catch lỗi 409 từ Backend và hiển thị một Modal liệt kê cụ thể các module đang cản trở thao tác.
- **Menu Hiding:** Frontend có một hook `useModules()` lấy danh sách module đang bật để ẩn đi các thanh điều hướng (Menu items) tương ứng trên Sidebar.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/module-configs` | `GET` | Lấy cấu hình toàn bộ module | `ADMIN`, `OPERATOR`, `VIEWER` |
| `/api/v1/module-configs/:key/toggle` | `PATCH` | Chuyển đổi trạng thái Bật/Tắt | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Toggle Core Module (Lỗi 400):** Cố ý gửi API tắt module CORE -> Ném `BadRequestException` "Cannot disable CORE modules".
- **Dependency Conflict (Lỗi 409):** Cố ý tắt module khi có module khác đang dùng -> Ném `ConflictException` kèm danh sách dependents.
- **Forbidden Route (Lỗi 403):** Truy cập vào API của module đã tắt -> ModuleGuard trả về `403 Forbidden`.

## 6. Hướng dẫn Bảo trì & Debug

- **Log & Trace:** Thao tác bật/tắt module được ghi nhận bởi `AuditLogInterceptor`.
- **Gotchas / Chú ý:** Cần nhớ truyền đúng `module_key` vào decorator `@RequireModule('...')` ở level Controller hoặc Handler. Nếu truyền sai chuỗi, Guard sẽ luôn từ chối truy cập do không tìm thấy module trong DB.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (Module Schema, Toggle logic, Dependency check UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
