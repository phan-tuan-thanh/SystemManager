# Sprint 03 — Quản lý Module & Feature Toggle

**Ngày bắt đầu:** 2026-04-10  
**Ngày kết thúc:** 2026-04-11  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai cơ chế kiểm soát tính năng (Feature Toggle) thông qua cấu hình Module, cho phép bật/tắt các phân hệ chức năng mà không cần can thiệp vào code.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: ModuleConfig**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `module_key` | `String` | Khoá định danh (VD: 'NETWORK_MGMT') | Unique |
| `module_type` | `Enum` | Loại module (`CORE` / `EXTENDED`) | Core không thể bị tắt |
| `status` | `Enum` | Trạng thái (`ENABLED` / `DISABLED`) | |
| `dependencies` | `String[]` | Danh sách module phụ thuộc | Mảng các `module_key` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Module Guard Protection)
- **ModuleGuard:** Một Guard toàn cục kiểm tra cấu hình trong DB. Nếu một route yêu cầu module `X` nhưng module `X` đang ở trạng thái `DISABLED`, hệ thống trả về `403 Forbidden`.
- **Dependency Validation:** Khi bật một module, hệ thống thực hiện kiểm tra đệ quy (Recursive check) để đảm bảo tất cả các module phụ thuộc cũng phải được bật. Ngược lại, khi tắt một module, hệ thống cảnh báo nếu có các module khác đang phụ thuộc vào nó.

### 3.2. Tầng Frontend (Module Console)
- **Card-based UI:** Hiển thị danh sách module dưới dạng các thẻ (Card). Mỗi thẻ hiển thị trạng thái hiện tại và nút Toggle.
- **Dependency Alert Modal:** Nếu người dùng thực hiện thao tác vi phạm ràng buộc phụ thuộc, một Modal sẽ hiện ra liệt kê danh sách các module cần xử lý trước.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/module-configs/:key/toggle` | `PATCH` | Bật/Tắt module | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (Module Schema, Toggle logic, Dependency check UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
