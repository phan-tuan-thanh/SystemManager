# Cài đặt Hệ thống (System Configuration)

Trang này chứa các tham số vận hành cốt lõi của toàn bộ nền tảng SystemManager. Hiện tại, hệ thống tập trung vào việc quản lý nhật ký vận hành (Logging).

## 1. Quản lý Nhật ký (Logging)
Hệ thống cho phép cấu hình chi tiết cách ghi nhận các sự kiện diễn ra trong quá trình vận hành.

### Các tham số cấu hình:
- **Bật/tắt ghi log**: Cho phép tạm dừng việc ghi nhật ký để tiết kiệm tài nguyên hoặc bảo trì.
- **Mức log (Log Level)**:
    - `error`: Chỉ ghi các lỗi nghiêm trọng gây dừng chương trình.
    - `warn`: Ghi lỗi và các cảnh báo tiềm ẩn rủi ro.
    - `info`: (Khuyến nghị) Ghi nhận các hoạt động thông thường của hệ thống.
    - `debug`: Ghi chi tiết phục vụ việc tìm lỗi (không dùng trên môi trường Production).
- **Đích ghi log**:
    - `Console`: Hiển thị log trực tiếp trên màn hình quản trị của server backend.
    - `File`: Lưu log vào các tệp tin văn bản định kỳ hàng ngày.

## 2. Lưu trữ File Log
Các file log được lưu trữ tại thư mục `logs/` của backend với định dạng `app-YYYY-MM-DD.log`. 
- Hệ thống tự động xoay vòng (rotate) file hàng ngày.
- Mặc định các file log cũ sẽ được giữ trong vòng **30 ngày** trước khi tự động xóa.

## 3. Xác thực & Bảo mật (Hiện trạng)
Hệ thống hiện hỗ trợ hai phương thức đăng nhập chính:
- **Tài khoản nội bộ (Local)**: Quản lý trực tiếp trong trang **Người dùng**.
- **Microsoft 365 (OIDC)**: Cho phép đăng nhập bằng tài khoản tổ chức (đang được cấu hình qua biến môi trường của hệ thống).

> [!NOTE]
> Các thay đổi về cấu hình Logging sẽ có hiệu lực ngay lập tức (Hot-reload) mà không cần phải khởi động lại máy chủ ứng dụng.

> [!TIP]
> Nếu hệ thống hoạt động chậm bất thường, hãy kiểm tra xem Mức log có đang để ở chế độ `debug` hoặc `verbose` không, vì việc ghi quá nhiều log có thể ảnh hưởng đến hiệu năng I/O.
