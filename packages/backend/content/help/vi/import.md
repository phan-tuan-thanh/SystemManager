# Hướng dẫn Import dữ liệu hàng loạt (CSV)

Hệ thống cung cấp công cụ import hàng loạt để bạn nhanh chóng khai báo danh sách **Server**, **Ứng dụng**, **Deployment** và **Kết nối** từ file CSV.

---

## Truy cập trang Import

- **Import Hạ tầng (Server):** Menu **Hạ tầng** → **Import Server từ CSV**
- **Import Ứng dụng / Deployment / Kết nối:** Menu **Ứng dụng** → **Import CSV**

---

## Quy trình nhập liệu — Wizard 4 bước

### Bước 1: Tải file lên
1. Nhấn vào khu vực thả file **hoặc kéo thả file CSV** trực tiếp vào đó.
2. Hệ thống tự động đọc tiêu đề cột từ dòng đầu tiên của file.
3. Sau khi chọn file, hệ thống **tự động chuyển sang Bước 2**.

> **Import nhanh (⚡):** Nếu tiêu đề cột khớp chuẩn, nhấn **Import nhanh** để bỏ qua wizard và import trực tiếp sau khi xác nhận.

### Bước 2: Ánh xạ cột (Column Mapping)
- Hệ thống tự động nhận diện các cột quen thuộc (ví dụ: `ip`, `name`, `hostname`).
- Với các cột không được nhận diện, bạn kéo thả hoặc chọn trường đích tương ứng.
- Cột có dấu **\*** là bắt buộc — phải được ánh xạ trước khi tiếp tục.
- **Value Mapping** (bên dưới): Chuẩn hoá các giá trị enum (ví dụ: `live` → `PROD`, `dc` → `DC`).

### Bước 3: Xem trước & Kiểm tra
- Hệ thống validate toàn bộ dữ liệu và hiển thị:
  - **Tổng số dòng**, **Hợp lệ**, **Lỗi**
  - Các dòng lỗi được highlight đỏ — nhấn vào ô để chỉnh sửa trực tiếp.
  - Nhấn **Kiểm tra lại** sau khi sửa để validate lại dữ liệu đã chỉnh.
- Bật switch **Chỉ lỗi** để lọc và xem chỉ các dòng có vấn đề.

### Bước 4: Hoàn tất Import
- Nhấn **Nhập X dòng hợp lệ** để thực thi.
- Kết quả hiển thị chi tiết: số bản ghi tạo mới / cập nhật / thất bại.
- Nhấn **Nhập thêm** để reset và bắt đầu phiên import mới.

---

## Cột bắt buộc theo loại dữ liệu

| Loại | Cột bắt buộc | Cột quan trọng |
|------|-------------|----------------|
| **Server** | `ip`, `name` | hostname, os, cpu, ram, environment, site, system |
| **Ứng dụng** | `code`, `name` | group_code, version, owner_team, application_type |
| **Deployment** | `app_code`, `server_ip`, `environment` | ports (định dạng `PORT-PROTOCOL:service_name`) |
| **Kết nối** | `source_app`, `target_app`, `environment` | target_port, protocol, description |

---

## Import Server — Lưu ý đặc biệt

- Dữ liệu được **Upsert** theo **Mã Server (code)** hoặc **IP Address** — nếu đã tồn tại sẽ cập nhật, chưa tồn tại sẽ tạo mới.
- Hệ thống tự động tạo **InfraSystem** nếu cột `system` hoặc `system_name` chứa tên hệ thống chưa có.
- Hệ điều hành (OS): nhập vào cột `os` (ví dụ: `Windows Server 2019`, `RHEL 8.4`). Hệ thống tự động tạo entry trong danh mục phần mềm hệ thống nếu chưa tồn tại.
- Cột `ports` cho Deployment hỗ trợ **nhiều cặp** cách nhau bởi dấu cách: `8080-HTTP:api 9090-GRPC:grpc-api`.

---

## Import Kết nối (Connection)

File CSV cần các cột:
- `source_app`: Mã ứng dụng nguồn (gửi request)
- `target_app`: Mã ứng dụng đích (nhận request)
- `environment`: Môi trường (`DEV`, `UAT`, `PROD`)
- `target_port` (tùy chọn): Port dịch vụ đích
- `protocol` (tùy chọn): Giao thức (`HTTP`, `HTTPS`, `GRPC`, `TCP`, ...)
- `description` (tùy chọn): Ghi chú về luồng dữ liệu

Sau khi import, các kết nối sẽ tự động xuất hiện trên sơ đồ **Topology**.

---

## Lưu ý chung

- Dòng đầu tiên của file **phải là tiêu đề cột** (header row).
- File CSV cần encoding **UTF-8** để hiển thị đúng tiếng Việt.
- Thử nghiệm với vài dòng ở môi trường **DEV** trước khi import quy mô lớn trên **PROD**.

> [!TIP]
> Tải file CSV mẫu từ thư mục `data/` trong source code để xem định dạng chuẩn cho từng loại dữ liệu.
