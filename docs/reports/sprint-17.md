# Sprint 17 — Wizard Import Hạ tầng (Server & Network)

**Ngày bắt đầu:** 2026-05-10  
**Ngày kết thúc:** 2026-05-12  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ nhập liệu hàng loạt (Bulk Import) cho tài nguyên hạ tầng. Giúp số hoá nhanh chóng hàng ngàn server từ các file Excel/CSV hiện có của doanh nghiệp.

## 2. Kiến trúc Import (Import Engine Architecture)

- **Session-based Import:** Sử dụng bộ nhớ đệm (In-memory Map) để lưu trữ phiên làm việc tạm thời trước khi lưu chính thức vào DB.
- **Components:** `ColumnMapper`, `ValueMapper`, `ValidationEngine`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Processing Logic)
- **Session Management:** Khi user upload file, backend tạo một `sessionId` và lưu trữ dữ liệu đã map vào bộ nhớ. Phiên làm việc tự động hết hạn sau 30 phút.
- **Phân tích OS (OS Resolution):** Thuật toán tự động tìm kiếm trong Danh mục ứng dụng để khớp tên OS trong file CSV. Nếu không tìm thấy, hệ thống gợi ý tạo mới OS dựa trên chuỗi văn bản thô.
- **Transactional Deployment:** Quá trình import server, mạng và phần cứng được bọc trong một Database Transaction duy nhất để đảm bảo không xảy ra tình trạng dữ liệu "nửa vời".

### 3.2. Tầng Frontend (4-Step Wizard UI)
- **Step 0 (Upload):** Sử dụng `Dragger` hỗ trợ kéo thả. Tích hợp tính năng **Import nhanh** (Tự động nhận diện cột và bỏ qua wizard nếu file chuẩn).
- **Step 1 (Mapping):**
  - `ColumnMapper`: Giao diện kéo thả hoặc chọn để khớp tiêu đề CSV với trường DB.
  - `ValueMapper`: Xử lý ánh xạ giá trị Enum (VD: "Live" trong CSV -> "PROD" trong DB).
- **Step 2 (Preview & In-place Edit):**
  - Hiển thị bảng dữ liệu với các dòng lỗi được tô đỏ (`preview-row-error`).
  - **Chỉnh sửa trực tiếp:** User có thể click vào ô dữ liệu lỗi để sửa trực tiếp trên bảng mà không cần sửa file CSV rồi upload lại.
  - **Kiểm tra lại (Re-validate):** Nút gửi dữ liệu đã sửa lên backend để kiểm tra lại tính hợp lệ trước khi thực thi.
- **Step 3 (Summary):** Hiển thị kết quả thống kê số lượng bản ghi Tạo mới (`Created`) và Cập nhật (`Updated`).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/import/preview` | `POST` | Phân tích file & tạo session | `OPERATOR` |
| `/import/execute` | `POST` | Lưu dữ liệu từ session vào DB | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Session Expired:** Trả về `404` nếu user để trang preview quá lâu mới bấm Import.
- **Port Conflict:** Cảnh báo nếu một IP/Port combo đã bị chiếm dụng bởi server khác.

## 6. Hướng dẫn Bảo trì & Debug

- **Cleanup:** Backend có cơ chế `CronJob` định kỳ xoá các file tạm trong thư mục `uploads/tmp`.

---

## 7. Metrics & Tasks

- Story Points: 25
- Tasks: 10 (CSV Parser, Mapping logic, Preview UI, In-place editing, OS Resolution)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
