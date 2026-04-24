# Quy trình Khai báo Hạ tầng mới

Chào mừng bạn đến với hệ thống quản lý hạ tầng. Dưới đây là các bước chi tiết để khai báo một hệ thống mới từ đầu.

## Bước 1: Khai báo Hệ thống Hạ tầng (Infra System)
Trước tiên, bạn cần tạo một "vỏ" bọc cho dự án.
1. Vào menu **Hạ tầng** > **Hệ thống**.
2. Nhấn **Thêm hệ thống**.
3. Nhập mã hệ thống (ví dụ: `ECOM`) và tên đầy đủ.
4. Chọn người phụ trách.

## Bước 2: Khai báo Server
Tiếp theo, hãy thêm các máy chủ vật lý hoặc ảo hóa.
1. Vào menu **Hạ tầng** > **Servers**.
2. Bạn có thể thêm thủ công từng server hoặc dùng tính năng **Import hàng loạt** (khuyên dùng nếu có nhiều server).
3. Đảm bảo nhập đúng **Hostname** và **IP** để hệ thống có thể giám sát sau này.

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
