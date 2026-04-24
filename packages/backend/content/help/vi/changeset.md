# Hướng dẫn ChangeSet (Draft & Preview)

Tính năng **ChangeSet** cho phép bạn thực hiện các thay đổi trên hạ tầng dưới dạng **Bản nháp (Draft)**, xem trước tác động trên sơ đồ, và chỉ áp dụng khi đã chắc chắn.

## Quy trình làm việc (Workflow)

### Bước 1: Tạo ChangeSet mới
1. Truy cập menu **ChangeSet**.
2. Nhấn **Tạo ChangeSet**, đặt tên (ví dụ: "Nâng cấp hệ thống tháng 5") và chọn môi trường.
3. Chuyển sang chế độ **Bản nháp (Draft)**.

### Bước 2: Thực hiện các thay đổi
- Trong khi ChangeSet đang mở ở trạng thái **Bản nháp**, mọi thao tác thêm/sửa/xóa Server, App, Kết nối... sẽ **không** được lưu vào cơ sở dữ liệu chính ngay lập tức.
- Các thay đổi này được tích lũy vào danh sách **Danh sách thay đổi**.

### Bước 3: Xem trước (Preview)
1. Nhấn nút **Xem trước thay đổi** trong trang chi tiết ChangeSet.
2. Hệ thống sẽ hiển thị sơ đồ Topology với các thay đổi dự kiến:
    - **Màu xanh**: Đối tượng sẽ được thêm mới.
    - **Màu đỏ**: Đối tượng sẽ bị xóa.
    - **Màu vàng**: Đối tượng có sự thay đổi thông tin.
3. Kiểm tra các cảnh báo xung đột (Conflict) nếu có.

### Bước 4: Áp dụng (Apply) hoặc Hủy bỏ (Discard)
- **Áp dụng (Apply)**: Cập nhật chính thức các thay đổi vào hệ thống. Sau khi Áp dụng, một bản chụp (Snapshot) sẽ được tạo tự động.
- **Hủy bỏ (Discard)**: Hủy bỏ toàn bộ bản nháp, hệ thống trở về trạng thái cũ.

## Ví dụ thực tế: Nâng cấp hệ thống Core Banking

**Kịch bản**: Bạn cần nâng cấp ứng dụng `Core-API` từ phiên bản `v1.1` lên `v1.2` trên 3 server PROD đồng thời thêm một kết nối mới tới dịch vụ `E-KYC`.

**Các bước thực hiện**:
1. Tạo ChangeSet: `Nâng cấp Core API v1.2`.
2. Truy cập chi tiết các Deployment của `Core-API`, đổi phiên bản thành `v1.2`.
3. Truy cập Topology, kéo đường nối từ `Core-API` sang `E-KYC`.
4. Nhấn **Preview ChangeSet**:
    - Hệ thống highlight 3 deployment cũ màu vàng (Cập nhật).
    - Highlight kết nối mới màu xanh (Thêm mới).
    - Cảnh báo: `Cần bổ sung hồ sơ tài liệu UAT cho phiên bản v1.2`.
5. Sau khi đội vận hành xác nhận, nhấn **Apply**.
6. Hệ thống tự động cập nhật dữ liệu thật và tạo một **Snapshot** để lưu lại mốc thời gian nâng cấp này.

> [!IMPORTANT]
> Một ChangeSet sau khi đã **Apply** sẽ không thể sửa đổi được nữa. Mọi thay đổi tiếp theo phải được thực hiện trong một ChangeSet mới.
