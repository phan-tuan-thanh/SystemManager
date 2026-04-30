# Quy trình Khai báo Hạ tầng mới

Chào mừng bạn đến với hệ thống quản lý hạ tầng. Dưới đây là các bước chi tiết để khai báo một hệ thống mới từ đầu.

## Bước 1: Khai báo Hệ thống Hạ tầng (Infra System)
Trước tiên, bạn cần tạo một "vỏ" bọc cho dự án.
1. Vào menu **Hạ tầng** > **Hệ thống**.
2. Nhấn **Thêm hệ thống**.
3. Nhập mã hệ thống (ví dụ: `ECOM`) và tên đầy đủ.
4. Chọn người phụ trách.

## Bước 2: Khai báo Server

Có 2 cách để thêm server:

### 2a. Thêm thủ công (1–5 server)
1. Vào menu **Hạ tầng** → **Servers**.
2. Nhấn **Thêm Server**, điền các thông tin cần thiết.
3. Đảm bảo nhập đúng **Hostname** và **IP** để hệ thống có thể theo dõi.

### 2b. Import hàng loạt từ CSV (khuyên dùng cho 5+ server)
1. Vào menu **Hạ tầng** → **Import Server từ CSV**.
2. Kéo thả hoặc chọn file CSV — hệ thống tự động chuyển sang bước ánh xạ cột.
3. Kiểm tra ánh xạ cột, nhấn **Tiếp theo: Xem trước** để xác nhận dữ liệu.
4. Sửa các dòng lỗi (nếu có) trực tiếp trên bảng, nhấn **Kiểm tra lại**.
5. Nhấn **Nhập X server hợp lệ** để hoàn thành.

> **Định dạng file CSV server:** Cột bắt buộc là `ip` và `name`. Các cột tùy chọn: `hostname`, `os`, `cpu`, `ram`, `total_storage_gb`, `environment`, `site`, `system`, `purpose`. Xem thêm tại mục **Import CSV (hàng loạt)**.

## Bước 3: Khai báo Ứng dụng
1. Vào menu **Ứng dụng** > **Ứng dụng**.
2. Khai báo tên ứng dụng, mã code và các cổng (Port) mà ứng dụng đó cung cấp.
3. Ví dụ: Ứng dụng `Web-Frontend` chạy port 80, 443.

## Bước 4: Triển khai (Deployment) - Liên kết App và Server
Đây là bước quan trọng nhất để xác định ứng dụng nào đang chạy trên máy chủ nào.
1. Vào menu **Ứng dụng** > **Deployments**.
2. Nhấn **Thêm Deployment**.
3. Chọn Server và Ứng dụng tương ứng.
4. Chọn môi trường (DEV, UAT, PROD).

> [!TIP]
> Sau khi hoàn thành 4 bước trên, hãy vào trang **Topology** để xem sơ đồ kết nối tự động được sinh ra.
