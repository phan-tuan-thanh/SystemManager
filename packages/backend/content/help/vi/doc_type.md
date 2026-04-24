# Quản lý Loại tài liệu (Document Types)

Tính năng này giúp bạn chuẩn hóa danh mục các hồ sơ cần thiết cho quy trình triển khai ứng dụng và kiểm soát tính tuân thủ.

## 1. Định nghĩa Loại tài liệu
Mỗi loại tài liệu đại diện cho một yêu cầu hồ sơ cụ thể mà đội vận hành cần cung cấp:
- **Mã loại**: Viết tắt để hệ thống nhận diện (ví dụ: `UAT_REPORT`).
- **Tên loại**: Tên hiển thị đầy đủ (ví dụ: `Biên bản kiểm thử người dùng`).

## 2. Các thuộc tính cấu hình
- **Bắt buộc (Required)**: Nếu đánh dấu là bắt buộc, các bản Deployment sẽ được tính là "Chưa tuân thủ" nếu thiếu tài liệu này.
- **Môi trường áp dụng**: Bạn có thể quy định loại tài liệu này chỉ bắt buộc cho môi trường `PROD` hoặc áp dụng cho `Tất cả` môi trường.
- **Thứ tự hiển thị**: Sắp xếp thứ tự danh sách tài liệu khi người dùng thực hiện upload.

## 3. Cách áp dụng thực tế
Khi một **Loại tài liệu** được tạo và ở trạng thái **ACTIVE**:
1. Nó sẽ tự động xuất hiện trong danh sách cần upload tại trang chi tiết của các bản **Deployment**.
2. Hệ thống sẽ theo dõi trạng thái từ `PENDING` (Chờ upload) cho đến `COMPLETE` (Hoàn thành) để tính điểm tuân thủ.

## 4. Ví dụ thực tế
**Kịch bản: Bổ sung yêu cầu hồ sơ Thiết kế mạng**
1. Tạo loại tài liệu mới: `NW_DESIGN`.
2. Tên: `Sơ đồ thiết kế mạng chi tiết`.
3. Chọn môi trường áp dụng: `PROD` và `UAT`.
4. Sau khi lưu, mọi deployment trên hai môi trường này sẽ yêu cầu phải có file thiết kế mạng mới được coi là hoàn thành hồ sơ.

> [!TIP]
> Bạn nên sử dụng tính năng **Vô hiệu hóa (Inactive)** thay vì xóa hoàn toàn một loại tài liệu nếu nó không còn dùng nữa, để tránh làm mất lịch sử dữ liệu của các deployment cũ.
