# Sprint 18 — Wizard Import Ứng dụng & Bóc tách Port phức tạp

**Ngày bắt đầu:** 2026-05-13  
**Ngày kết thúc:** 2026-05-15  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Mở rộng công cụ Import cho khối Ứng dụng và triển khai thuật toán bóc tách dữ liệu Port từ chuỗi văn bản phức tạp (Regex-based parsing).

## 2. Kiến trúc Phân tích (Parsing Architecture)

- **Regex Engine:** Sử dụng các mẫu biểu thức chính quy để bóc tách cấu trúc `Port-Protocol:ServiceName`.
- **Logic:** Hỗ trợ nhập liệu nhiều port trên một dòng (cách nhau bởi dấu phẩy).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Advanced Parsing Logic)
- **Multi-port String Parser:** Thuật toán bóc tách chuỗi (VD: "80-TCP:Web, 443-TCP:HTTPS").
  - Phân tích dải port (Range) và giao thức đi kèm.
  - Tự động chuẩn hoá tên dịch vụ (Service name).
- **Auto-connection Resolver:** Khi import ứng dụng, hệ thống tự động kiểm tra bảng `AppConnection` để thiết lập các liên kết dựa trên mã ứng dụng nguồn/đích có trong file.

### 3.2. Tầng Frontend (Application Import UI)
- **Môi trường hoá (Environment Context):** Cho phép chọn môi trường áp dụng cho toàn bộ file import để giảm bớt việc nhập liệu trong CSV.
- **In-place Error Correction:** Tương tự module hạ tầng, hỗ trợ sửa lỗi trực tiếp trên giao diện preview cho các trường Mã ứng dụng, Version, Team phụ trách.
- **Mapping Aliases:** Hệ thống tự động nhận diện các cột dựa trên alias (VD: "Phòng ban", "Đơn vị" -> `owner_team`).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/import/preview?type=app` | `POST` | Phân tích Ứng dụng & Port | `OPERATOR` |
| `/import/execute` | `POST` | Lưu ứng dụng & Tạo kết nối | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Invalid Port Format:** Trả về lỗi chi tiết tại dòng có format port không hợp lệ (VD: "80/ABC").
- **Group Code Missing:** Nếu mã nhóm không tồn tại, hệ thống gợi ý tạo mới nhóm hoặc bỏ qua.

## 6. Hướng dẫn Bảo trì & Debug

- **Regex Test:** Có thể kiểm tra lại biểu thức chính quy trong `ImportService.parsePortsString` nếu cần hỗ trợ thêm các format port mới.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (App Mapping logic, Regex Port Parser, Connection resolver, Import UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
