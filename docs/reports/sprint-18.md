# Sprint 18 — Multi-Port Parser & Advanced Connection Import

**Ngày bắt đầu:** 2026-05-11  
**Ngày kết thúc:** 2026-05-12  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Nâng cấp bộ máy Import dữ liệu lên mức độ cao cấp. Hỗ trợ bóc tách cú pháp Port phức tạp (Multi-port string) và tự động ánh xạ quan hệ kết nối giữa các ứng dụng trên đồ thị Topology.

## 2. Kiến trúc & Logic Phân tích (Architecture)

- **Multi-port String Format:** Quy định chuẩn `Port-Protocol:ServiceName` (VD: `80-HTTP:Web 443-HTTPS:Secure`).
- **Connection Resolving:** Logic tự động tìm kiếm `source_app_id` và `target_app_id` dựa trên Mã ứng dụng (App Code) trong file import.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Bộ bóc tách Port (Multi-port Parser)
- **Hàm `parsePortsString`:**
  - Sử dụng Regex và xử lý chuỗi để tách mảng các cổng kết nối từ một ô dữ liệu duy nhất trong Excel.
  - Hỗ trợ các trường hợp viết tắt: Nếu không có Protocol, mặc định là `HTTP`. Nếu không có ServiceName, mặc định là `null`.
- **Dữ liệu:** Sau khi parse, hệ thống tạo ra nhiều bản ghi trong bảng `Port` liên kết tới cùng một `AppDeployment`.

### 3.2. Import Kết nối Topology (Connection Import)
- Cho phép khai báo quan hệ phụ thuộc giữa App A và App B hàng loạt.
- **Logic thông minh:** Hệ thống tự động tra cứu xem App Đích đang mở Port nào trong môi trường đó để gán `target_port_id` chính xác cho kết nối. Nếu App Đích chỉ có 1 port, hệ thống tự động link mà không cần user chỉ định port trong file.

### 3.3. Phân loại Mạng (Network Zone Import)
- Hỗ trợ import các phân vùng mạng (DMZ, LOCAL, DB) và các dải IP (IP Range/CIDR) thuộc phân vùng đó để hiển thị trên bản đồ Topology.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Tham số | Chức năng | Quyền |
|---|---|---|---|---|
| `/import/preview` | `POST` | `type: 'connection'`| Preview kết nối Topology | `OPERATOR` |
| `/import/preview` | `POST` | `type: 'zone_ip'` | Import dải IP phân vùng | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **App Missing:** Nếu `source_app` hoặc `target_app` không tồn tại trong Catalog, dòng import đó sẽ bị đánh dấu `Invalid` kèm lý do cụ thể để user sửa lại trong file.

## 6. Hướng dẫn Bảo trì & Debug

- **Cú pháp Port:** Đảm bảo dấu gạch ngang `-` và dấu hai chấm `:` được sử dụng đúng chuẩn để parser không bỏ sót thông tin protocol/service.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Multi-port parser, Connection auto-resolving, Network Zone import logic, Advanced validation)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
