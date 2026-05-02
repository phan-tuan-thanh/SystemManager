# Sprint 03 — Cấu hình Module & Feature Toggle

**Ngày bắt đầu:** 2026-04-11  
**Ngày kết thúc:** 2026-04-12  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng cơ chế bật/tắt tính năng động (Feature Toggle). Cho phép Admin quản lý các module trong hệ thống, kiểm soát sự phụ thuộc giữa các module và bảo vệ các chức năng cốt lõi (Core) khỏi việc bị vô hiệu hoá nhầm.

## 2. Kiến trúc Module (Module Architecture)

- **Phân loại Module:**
  - **CORE:** Bắt buộc phải hoạt động (VD: Server Mgmt, User Mgmt). Không thể tắt.
  - **EXTENDED:** Các module mở rộng (VD: Topology 3D, Import CSV). Có thể bật/tắt tuỳ nhu cầu.
- **Dependencies:** Mỗi module có thể khai báo danh sách các module khác mà nó phụ thuộc (`dependencies` array).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Module Guard Logic)
- **ModuleGuard:** Một Guard toàn cục sử dụng `Reflector` để đọc metadata `@RequireModule(key)` gắn trên các Controller/Route. 
- **Cơ chế chặn:** Guard truy vấn bảng `ModuleConfig`. Nếu module tương ứng đang ở trạng thái `DISABLED`, API sẽ trả về `403 Forbidden` ngay lập tức.
- **Idempotent Init:** Hàm `initialize` trong `SystemService` đảm bảo danh sách module luôn được đồng bộ với định nghĩa trong code (Upsert logic).

### 3.2. Tầng Frontend (Module Config UI)
- **Dependency Modal (Logic then chốt):**
  - **Khi Bật:** Frontend kiểm tra danh sách `dependencies` của module. Nếu có module phụ thuộc nào đang bị tắt, hệ thống hiển thị cảnh báo đỏ và chặn nút "Bật".
  - **Khi Tắt:** Hệ thống quét toàn bộ danh sách module để tìm các module khác đang phụ thuộc vào module này. Nếu tìm thấy, hiển thị cảnh báo về các module sẽ bị ảnh hưởng (Cascading effect).
- **Core Protection:** UI sử dụng thuộc tính `disabled` trên các Switch điều khiển đối với module loại `CORE`, ngăn chặn mọi tương tác nhầm lẫn từ phía Admin.
- **UI State Sync:** Sử dụng `TanStack Query` để duy trì trạng thái "Loading" của Switch trong lúc đợi API phản hồi, tránh tình trạng click đúp (Double click).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/system/modules` | `GET` | Lấy danh sách cấu hình module | `VIEWER` |
| `/system/modules/:key/toggle` | `PATCH` | Bật/Tắt module mở rộng | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Forbidden:** Nếu user truy cập link trực tiếp tới một trang đã bị tắt module, Backend trả về `403` và Frontend (Axios Interceptor) sẽ hiển thị trang báo lỗi "Feature Disabled".
- **Dependency Conflict:** Backend kiểm tra lại một lần nữa logic phụ thuộc trước khi lưu DB để đảm bảo tính toàn vẹn ngay cả khi có người gọi API trực tiếp.

## 6. Hướng dẫn Bảo trì & Debug

- **New Module:** Khi thêm module mới, hãy khai báo trong `SystemService.initialize()` và chạy lại API khởi tạo.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Module Schema, ModuleGuard, Dependency Logic, Admin UI, Switch components)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
