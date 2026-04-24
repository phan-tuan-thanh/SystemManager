# Hướng dẫn Dashboard & Tổng quan Hệ thống

Trang **Dashboard** là trung tâm điều hành, cung cấp cái nhìn tổng thể về sức khỏe và quy mô của toàn bộ hạ tầng kỹ thuật.

## Các khối thông tin chính

### 1. Chỉ số tổng hợp (Key Metrics)
- **Tổng số Server**: Phân loại theo môi trường (DEV, UAT, PROD).
- **Tổng số Ứng dụng**: Số lượng phần mềm đang được quản lý.
- **Tỷ lệ Deployment thành công**: Phần trăm các ứng dụng đang ở trạng thái `RUNNING`.
- **Tình trạng Hồ sơ**: Số lượng deployment còn thiếu tài liệu bắt buộc.

### 2. Sức khỏe hệ thống (Environment Health)
- Biểu đồ thể hiện trạng thái hoạt động của các server theo thời gian thực.
- Nhấn vào từng môi trường để xem nhanh danh sách các server đang gặp sự cố (Down).

### 3. Hoạt động gần đây (Recent Activities)
- Hiển thị 5-10 thao tác mới nhất trên hệ thống (Audit Log tóm tắt).
- Giúp quản trị viên nắm bắt nhanh các thay đổi vừa diễn ra.

## Ví dụ thực tế
- **Tình huống**: Bạn bắt đầu ngày làm việc và muốn biết có sự cố nào nghiêm trọng không.
- **Thực hiện**: 
    1. Kiểm tra mục **Environment Health**. Nếu cột **PROD** có màu đỏ, hãy nhấn vào đó.
    2. Hệ thống sẽ liệt kê các server PROD đang mất kết nối.
    3. Kiểm tra mục **Recent Activities** để xem có ai vừa thực hiện ChangeSet nào gây ra lỗi không.

---

# Hướng dẫn Thiết lập Hệ thống (Setup)

Trang **Setup** dành cho quản trị viên để khởi tạo các tham số nền tảng trước khi bắt đầu quản lý chi tiết.

## Các bước thiết lập cơ bản

1. **Khai báo InfraSystem**: Định nghĩa các hệ thống nghiệp vụ (ví dụ: Hệ thống Thẻ, Hệ thống Mobile Banking).
2. **Khai báo AppGroup**: Phân nhóm ứng dụng (ví dụ: Frontend, Backend, Database, Middleware).
3. **Cấu hình Môi trường & Site**: Thiết lập các vùng vật lý (DC/DR) và môi trường triển khai.

> [!TIP]
> Việc thiết lập cấu trúc Nhóm và Hệ thống chính xác ngay từ đầu sẽ giúp các báo cáo và sơ đồ Topology sau này trở nên mạch lạc và dễ hiểu hơn.
