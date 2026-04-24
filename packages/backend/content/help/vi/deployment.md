# Hướng dẫn Chi tiết Deployment & Hồ sơ Tài liệu

**Deployment** là sự kết nối giữa Phần mềm (Application) và Phần cứng (Server). Đây là nơi quản lý các thông tin vận hành thực tế nhất.

## Quản lý trạng thái Deployment
- **Running**: Ứng dụng đang hoạt động bình thường.
- **Stopped**: Ứng dụng đang tạm dừng.
- **Maintenance (Bảo trì)**: Ứng dụng đang trong quá trình bảo trì kỹ thuật.

## Hồ sơ Tài liệu (Compliance Documents)
Hệ thống quản lý tính tuân thủ thông qua bộ hồ sơ tài liệu cho từng bản Deployment (đặc biệt là trên môi trường **PROD**).

### Các trạng thái hồ sơ:
1. **Chờ upload (PENDING)**: Tài liệu chưa có dữ liệu.
2. **Đã có bản nháp (PREVIEW)**: Đã tải lên file thảo (Word/Excel/PDF).
3. **Hoàn thành (COMPLETE)**: Đã tải lên bản chính thức (thường là file PDF đã ký).
4. **Được miễn (WAIVED)**: Tài liệu không bắt buộc cho trường hợp này (cần nhập lý do miễn).

### Quy trình cập nhật hồ sơ:
1. Vào tab **Tài liệu** trong trang chi tiết Deployment.
2. Sử dụng nút **Upload nháp** cho các file đang soạn thảo.
3. Sử dụng nút **Upload PDF chính thức** khi tài liệu đã được phê duyệt và ký số/ký tay.
4. Khi đạt trạng thái **Hoàn thành**, hệ thống sẽ ghi nhận điểm tuân thủ cho ứng dụng.

## Ví dụ thực tế
- **Yêu cầu**: Cập nhật hồ sơ cho ứng dụng `Mobile App API` vừa mới nâng cấp lên v2.0.
- **Thực hiện**:
    1. Tìm ứng dụng `Mobile App API` và chọn bản deployment trên server tương ứng.
    2. Tại tab **Hồ sơ tài liệu**, chọn mục **Biên bản bàn giao**.
    3. Nhấn **Tải lên**, chọn file PDF biên bản đã ký.
    4. Hệ thống sẽ cập nhật tiến độ tài liệu lên 100%. Thanh trạng thái của ứng dụng trên Dashboard sẽ chuyển sang màu xanh (Hoàn tất hồ sơ).

> [!IMPORTANT]
> Nếu hồ sơ chưa đạt 100% Final, hệ thống sẽ cảnh báo "Chưa tuân thủ" trong các báo cáo kiểm soát định kỳ.
