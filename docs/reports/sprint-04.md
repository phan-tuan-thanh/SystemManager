# Sprint 04 — Quản lý Linh kiện (Hardware Inventory)

**Ngày bắt đầu:** 2026-04-13  
**Ngày kết thúc:** 2026-04-14  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý chi tiết linh kiện phần cứng (Hardware Inventory). Cho phép theo dõi cấu hình chi tiết (CPU, RAM, Disk) gắn với từng Server và lưu vết lịch sử thay đổi cấu hình linh kiện (Thêm/Bớt/Thay thế).

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `HardwareComponent`:**
  - `server_id`: Liên kết với bảng Server.
  - `type`: Loại linh kiện (CPU, RAM, DISK, v.v.).
  - `specs`: Trường JSON lưu thông số kỹ thuật động (VD: `{ cores: 8, threads: 16 }`).
- **Quan hệ:** Một Server có quan hệ 1-n với `HardwareComponent`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Quản lý Cấu hình Động (JSON Specs)
- **Logic:** Vì mỗi loại linh kiện có các thông số khác nhau (RAM cần bus, dung lượng; Disk cần loại SSD/HDD, tốc độ), hệ thống sử dụng trường JSON `specs`.
- **Frontend:** Sử dụng Form.List (Key-Value Editor) để người dùng nhập các cặp thông số tuỳ ý.

### 3.2. Theo dõi Lịch sử Thay đổi (Change History)
- **Cơ chế:** Tích hợp `ChangeHistoryService`. 
- Khi thực hiện `CREATE`, `UPDATE`, `ATTACH` (chuyển linh kiện sang server khác), hoặc `DETACH` (tháo linh kiện), hệ thống tự động lưu lại Snapshot dữ liệu trước và sau thay đổi.
- **API `getHistory`:** Trả về Timeline các lần thay đổi của linh kiện đó.

### 3.3. Tháo gỡ Linh kiện (Detach/Retire)
- Khi tháo linh kiện (`detach`), hệ thống thực hiện Soft Delete (`deleted_at`) để đánh dấu linh kiện này đã ngừng sử dụng nhưng vẫn giữ lại lịch sử trong DB để phục vụ báo cáo.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/hardware` | `POST` | `CreateHardwareDto` | Tạo mới và gắn vào Server | `OPERATOR` |
| `/hardware/:id/attach` | `POST` | `{ server_id: string }` | Chuyển linh kiện sang Server khác | `OPERATOR` |
| `/hardware/:id/history`| `GET` | N/A | Xem timeline thay đổi linh kiện | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Server Not Found:** Khi gắn linh kiện, hệ thống kiểm tra sự tồn tại và trạng thái của Server. Nếu Server đã bị xoá mềm, trả về `404 Not Found`.

## 6. Hướng dẫn Bảo trì & Debug

- **Debug JSON Specs:** Nếu giao diện không hiển thị đúng specs, hãy kiểm tra raw JSON trong bảng `HardwareComponent`. Prisma sẽ tự động parse JSON thành Object khi fetch.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Hardware Schema, Service Logic, ChangeHistory integration, Key-Value UI, History Timeline)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
