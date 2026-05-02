# Sprint 17 — Wizard Import & Quản lý Phiên dữ liệu

**Ngày bắt đầu:** 2026-05-22  
**Ngày kết thúc:** 2026-05-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ nhập liệu hàng loạt (Bulk Import) cho phép Upload dữ liệu bằng file Excel/CSV, cung cấp giao diện Preview tương tác để soát lỗi trước khi ghi vào Database.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ImportPreviewDTO**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `session_id` | `String` | ID của phiên làm việc (Session) | Định dạng UUID |
| `total_rows` | `Int` | Tổng số dòng đọc được | |
| `valid_rows` | `Array` | Dữ liệu các dòng hợp lệ | |
| `invalid_rows` | `Array` | Dữ liệu các dòng có lỗi | Kèm theo field `errors` |
| `mapping` | `Object` | Cấu hình ánh xạ cột CSV -> DB | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **In-memory Session Logic:** Dữ liệu tải lên không được lưu thẳng vào DB. Backend phân tích file và lưu vào biến bộ nhớ (hoặc Redis) gọi là `SessionMap` có khóa là `session_id`. Mỗi session tự hủy sau 15 phút (TTL).
- **Execution Transaction:** Khi user nhấn "Import", Backend nhận lệnh thực thi trên `session_id` đang lưu. Quá trình INSERT thực hiện trong một Transaction. Nếu một dòng thất bại do constraint DB chưa lường trước, toàn bộ lô sẽ bị Rollback để không làm rác Database.

### 3.2. Tầng Frontend (Client-side Logic)
- **4-Step Wizard UI:**
  - Bước 1: Drag & drop upload file.
  - Bước 2: Kéo thả các cột CSV để map (ánh xạ) với cột tương ứng trong hệ thống.
  - Bước 3: Xem trước (Preview). Cung cấp bảng dữ liệu có khả năng **Inline Edit**. Các ô dữ liệu sai định dạng (Ví dụ chữ trong ô số lượng) bị bôi đỏ. User có thể sửa trực tiếp trên bảng.
  - Bước 4: Hiển thị kết quả (Bao nhiêu % thành công, xuất file log nếu có lỗi).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/import/preview` | `POST` | Gửi file lên để phân tích & bóc tách | `OPERATOR` |
| `/api/v1/import/execute` | `POST` | Chốt dữ liệu để đẩy vào DB thật | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Session Expired (Lỗi 410 / 404):** Nếu user bỏ đi quá 15 phút rồi quay lại bấm "Import", Backend trả về 410 Gone. Frontend reset wizard và yêu cầu upload lại.
- **Header Mismatch (Lỗi 400):** Cột bóc tách từ file CSV không khớp với cấu hình mapping được định nghĩa.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi file quá nặng (> 100k dòng), việc lưu vào memory nodejs có thể gây tràn RAM. Lúc này cần config cấu hình qua Redis Session Storage để an toàn.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Import Service, Session logic, 4-step UI wizard)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
