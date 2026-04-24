# Quy trình Triển khai & Thay đổi (ChangeSet)

Hệ thống hỗ trợ cơ chế "Draft & Preview" (Bản nháp và Xem trước) giúp bạn kiểm soát các thay đổi hạ tầng phức tạp mà không làm ảnh hưởng đến dữ liệu đang vận hành.

## 1. Khi nào nên dùng ChangeSet?
- Khi bạn cần thêm/sửa/xóa nhiều đối tượng cùng lúc (ví dụ: Nâng cấp cả một cụm Microservices).
- Khi bạn muốn xem trước tác động của thay đổi lên sơ đồ Topology trước khi thực hiện thật.

## 2. Các bước thực hiện chi tiết

### Bước 1: Khởi tạo ChangeSet
1. Vào menu **Giám sát** > **ChangeSets**.
2. Nhấn **Tạo ChangeSet**. Đặt tên dễ hiểu, ví dụ: `Nâng cấp hệ thống Core - Q2`.
3. Sau khi tạo, hãy nhấn vào tiêu đề để vào trang chi tiết.

### Bước 2: Kích hoạt chế độ Bản nháp (Draft Mode)
1. Trong trang chi tiết ChangeSet, hãy bật công tắc **Chế độ Bản nháp**.
2. Lúc này, hệ thống sẽ ghi nhận mọi thao tác sửa đổi của bạn vào "giỏ hàng" này thay vì lưu trực tiếp.

### Bước 3: Thực hiện các thay đổi
- Bạn có thể sang trang Server để sửa cấu hình.
- Sang trang Application để thêm Port mới.
- Sang trang Topology để kéo thả tạo kết nối mới giữa các App.
- Tất cả sẽ hiện ra trong tab **Danh sách thay đổi** của ChangeSet.

### Bước 4: Xem trước & Đối soát
1. Quay lại trang ChangeSet của bạn.
2. Nhấn **Xem trước thay đổi**.
3. Hệ thống hiển thị sơ đồ so sánh (Diff):
    - **Xanh**: Sẽ thêm mới.
    - **Vàng**: Sẽ cập nhật.
    - **Đỏ**: Sẽ xóa.

### Bước 5: Áp dụng (Apply)
- Nếu mọi thứ đã đúng, nhấn **Áp dụng**. 
- Hệ thống sẽ thực thi toàn bộ danh sách thay đổi trong một giao dịch duy nhất và tạo bản chụp (Snapshot) tự động.

> [!IMPORTANT]
> Sau khi Áp dụng, ChangeSet sẽ chuyển sang trạng thái "Đã áp dụng" và không thể sửa đổi thêm.
