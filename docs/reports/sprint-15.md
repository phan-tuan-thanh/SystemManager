# Sprint 15 — Vòng đời Hệ điều hành (OS Lifecycle)

**Ngày bắt đầu:** 2026-05-16  
**Ngày kết thúc:** 2026-05-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý chi tiết lịch sử cài đặt, nâng cấp hệ điều hành (OS) trên từng máy chủ, cung cấp cơ chế cảnh báo thời hạn hỗ trợ (EOL).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ServerOsInstall**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `application_id` | `UUID` | ID OS trong App Catalog | Foreign Key |
| `server_id` | `UUID` | Máy chủ cài đặt | Foreign Key |
| `version` | `String` | Phiên bản (VD: '22.04 LTS') | `Required` |
| `installed_at` | `DateTime` | Thời gian bắt đầu sử dụng | `Required` |
| `replaced_at` | `DateTime` | Thời gian thay OS mới | `Nullable` |
| `change_ticket` | `String` | Mã vé yêu cầu nâng cấp | `Nullable` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **OS Replacement Transaction:** Khi update một OS mới cho Server, Backend chạy DB Transaction thực hiện 3 lệnh đồng thời:
  1. Update bản ghi OS cũ: Cập nhật `replaced_at` thành thời điểm hiện tại.
  2. Tạo bản ghi OS mới.
  3. Update bảng Server: Cập nhật con trỏ `current_os_install_id` trỏ về bản ghi vừa tạo.

### 3.2. Tầng Frontend (Client-side Logic)
- **OS Timeline Tab:** Thiết kế tab Vòng đời OS bằng component `Timeline` của AntD. Render danh sách dọc từ OS mới nhất đến cũ nhất.
- **EOL Warning Badge:** Hàm `calculateEolStatus()` tính số ngày còn lại đến `eol_date` của OS. Nếu còn < 30 ngày, hiển thị huy hiệu Cảnh báo màu vàng. Nếu đã qua hạn, hiển thị huy hiệu Nguy hiểm màu đỏ.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/servers/:id/os-installs` | `GET` | Truy vấn lịch sử vòng đời OS | `VIEWER` |
| `/api/v1/servers/:id/os-installs` | `POST` | Ghi nhận cài mới / nâng cấp OS | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Date Overlap (Lỗi 400):** Khi sửa `installed_at`, DTO validator kiểm tra đảm bảo ngày cài đặt bản mới không được trỏ về trước ngày sinh của bản cũ.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi Server bị đổi mục đích và format ổ cứng (Không còn OS), phải gửi API cập nhật `current_os_install_id = null`.

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (OS Schema, Lifecycle logic, Timeline UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
