# Sprint 15 — OS Lifecycle & Upgrade Tracking

**Ngày bắt đầu:** 2026-05-05  
**Ngày kết thúc:** 2026-05-06  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Chuyên nghiệp hoá việc quản lý Hệ điều hành (OS) trên Server. Cho phép theo dõi lịch sử cài đặt, nâng cấp OS (OS Lifecycle) và quản lý các lý do thay đổi (Change Reason), đáp ứng yêu cầu khắt khe về nhật ký vận hành.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `ServerOsInstall`:**
  - `installed_at`: Ngày cài đặt.
  - `replaced_at`: Ngày bị thay thế bởi OS mới (được set tự động).
  - `change_reason`, `change_ticket`: Lý do và mã vé thay đổi.
- **Quan hệ:** `Server` (1) - (1) `current_os_install` và (1) - (n) `os_history`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Quy trình Cài đặt OS (Install/Upgrade Logic)
- **Logic (`installOs`):** Được bọc trong một **Database Transaction** để đảm bảo tính nhất quán tuyệt đối:
  1. **Bước 1:** Kiểm tra OS cũ. Nếu có, cập nhật trường `replaced_at` của bản ghi cũ bằng thời gian hiện tại.
  2. **Bước 2:** Tạo bản ghi `ServerOsInstall` mới với thông tin phiên bản và lý do thay đổi.
  3. **Bước 3:** Cập nhật con trỏ `current_os_install_id` trên bảng Server trỏ về bản ghi mới nhất.
- **Ràng buộc:** Bắt buộc phải có `change_reason` nếu đây là hành động nâng cấp (Server đã có OS từ trước).

### 3.2. Real-time Status Update (PubSub)
- Khi trạng thái Server thay đổi (VD: Đang cài lại OS -> Maintenance), hệ thống sử dụng `PubSub` để phát đi sự kiện `SERVER_STATUS_CHANGED`.
- Các Client đang mở sơ đồ Topology sẽ nhận được thông báo và cập nhật màu sắc node ngay lập tức mà không cần F5 trang.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/servers/:id/install-os` | `POST` | `CreateOsInstallDto` | Cài đặt/Nâng cấp OS | `OPERATOR` |
| `/servers/:id/os-history` | `GET` | N/A | Xem lịch sử nâng cấp OS | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Invalid Software Type:** Chặn việc "cài đặt" một ứng dụng nghiệp vụ vào vị trí của Hệ điều hành. Chỉ chấp nhận các Application có `application_type: SYSTEM` và `sw_type: OS`.

## 6. Hướng dẫn Bảo trì & Debug

- **Migration Note:** Cần đảm bảo `current_os_install_id` luôn khớp với bản ghi mới nhất trong `ServerOsInstall` có trường `replaced_at: null`.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (OS Install Table, Transactional Update Logic, PubSub integration, OS History UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
