# Sprint 03 — Quản lý Cấu hình Module (Module Guard)

**Ngày bắt đầu:** 2026-04-11  
**Ngày kết thúc:** 2026-04-12  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Phát triển cơ chế quản lý tính năng động (Feature Toggling). Cho phép Quản trị viên bật/tắt các Module nghiệp vụ (như Topology, Network, Hardware) thông qua giao diện mà không cần can thiệp vào mã nguồn hoặc cấu hình môi trường.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Table `ModuleConfig`:**
  - `module_key`: Khoá định danh duy nhất (VD: `TOPOLOGY`, `NETWORK`).
  - `status`: Enum `ENABLED` / `DISABLED`.
  - `is_core`: Cờ đánh dấu module hệ thống bắt buộc (không được phép tắt).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Cơ chế Kiểm soát Module (ModuleGuard)
- **Decorator `@RequireModule(key)`:** Được sử dụng tại Controller hoặc Route để khai báo module phụ thuộc.
- **Logic Guard (`ModuleGuard.ts`):**
  - Sử dụng `Reflector` để lấy `moduleKey` từ metadata của route.
  - Truy vấn `PrismaService.moduleConfig.findUnique` để lấy trạng thái thực tế.
  - Nếu bản ghi không tồn tại hoặc có `status === 'DISABLED'`, ném ngay `ForbiddenException`.
- **Ưu điểm:** Chặn request ngay từ tầng Guard, không cho phép logic service chạy, giúp bảo vệ tài nguyên hệ thống.

### 3.2. Bảo vệ Module Core
- Tại `ModuleConfigService.update`, hệ thống kiểm tra cờ `is_core`. Nếu user cố gắng chuyển trạng thái module core sang `DISABLED`, hệ thống sẽ trả về lỗi `BadRequestException` chặn hành động này.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/module-configs` | `GET` | N/A | Lấy danh sách trạng thái module | `ADMIN` |
| `/module-configs/:key` | `PATCH` | `{ status: string }` | Bật/Tắt module | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Module Missing:** Nếu decorator gọi một module key không có trong DB, hệ thống mặc định coi đó là `DISABLED` để đảm bảo an toàn.
- **Response Format:** Lỗi do ModuleGuard ném ra có format chuẩn: `{ "statusCode": 403, "message": "Module 'XXX' is currently disabled" }`.

## 6. Hướng dẫn Bảo trì & Debug

- **Thêm module mới:** Sau khi tạo module mới, cần chạy file seed hoặc thêm bản ghi vào bảng `ModuleConfig` thủ công để có thể sử dụng decorator `@RequireModule`.
- **Kiểm tra logic:** Nếu một API bỗng dưng trả về 403 dù user là Admin, hãy kiểm tra trạng thái module tương ứng trong bảng `ModuleConfig`.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (Module DB Schema, Decorator, ModuleGuard, Admin UI, Unit Tests)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
