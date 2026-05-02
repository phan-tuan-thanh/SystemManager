# Sprint 15 — Vòng đời Hệ điều hành (OS Lifecycle)

**Ngày bắt đầu:** 2026-05-16  
**Ngày kết thúc:** 2026-05-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý chi tiết lịch sử cài đặt, nâng cấp hệ điều hành (OS) và cảnh báo thời hạn hỗ trợ (EOL).

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: ServerOsInstall**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `application_id` | `UUID` | Link tới bản ghi OS trong Catalog | Foreign Key |
| `version` | `String` | Phiên bản OS (VD: '22.04 LTS') | |
| `installed_at` | `DateTime` | Ngày cài đặt | |
| `replaced_at` | `DateTime` | Ngày bị thay thế bởi OS mới | Nullable |
| `change_ticket` | `String` | Mã ticket yêu cầu thay đổi | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (OS Versioning)
- **Lifecycle History:** Khi một Server được cập nhật OS mới, bản ghi `ServerOsInstall` cũ sẽ được cập nhật `replaced_at`, và một bản ghi mới được tạo ra. Toàn bộ chuỗi sự kiện này diễn ra trong một **Transaction** để đảm bảo tính nhất quán.
- **Current OS Pointer:** Trường `current_os_install_id` trên bảng `Server` luôn trỏ về bản ghi OS đang có hiệu lực gần nhất.

### 3.2. Tầng Frontend (Timeline View)
- **OS Timeline Tab:** Trong chi tiết Server, tab "Vòng đời OS" hiển thị một Timeline trực quan cho biết Server này đã dùng những hệ điều hành nào trong quá khứ, ai là người cài đặt và lý do thay đổi.
- **EOL Warning Badge:** Nếu OS hiện tại đã vượt quá `eol_date` trong Catalog, hệ thống hiển thị cảnh báo đỏ cạnh thông tin OS.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/servers/:id/os-installs` | `GET` | Lấy lịch sử cài đặt OS | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (OS Schema, Lifecycle logic, Timeline UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
