# Quy trình Quản lý Tài liệu Tuân thủ (Compliance)

Hệ thống yêu cầu các ứng dụng phải có đầy đủ tài liệu vận hành và bảo mật trước khi được phép chạy chính thức trên môi trường PROD.

## 1. Khai báo Loại tài liệu
Chỉ quản trị viên mới có thể thực hiện bước này.
1. Vào menu **Quản trị** > **Loại tài liệu**.
2. Định nghĩa các loại tài liệu bắt buộc (ví dụ: `Hồ sơ thiết kế`, `Biên bản kiểm thử`, `Security Scan`).
3. Đánh dấu mức độ quan trọng (Bắt buộc hoặc Tùy chọn).

## 2. Theo dõi trạng thái tài liệu
1. Vào chi tiết một **Deployment**.
2. Tab **Tài liệu** sẽ hiển thị danh sách các tài liệu cần có.
3. Các trạng thái:
    - **Chờ upload**: Chưa có file.
    - **Đã có bản nháp**: File đã tải lên nhưng chưa được phê duyệt.
    - **Hoàn thành**: Tài liệu hợp lệ.
    - **Miễn**: Không yêu cầu cho deployment này.

## 3. Quy trình nộp hồ sơ
1. Nhấn nút **Upload** tại dòng tài liệu tương ứng.
2. Chọn file và lưu lại.
3. Người quản lý sẽ rà soát và chuyển trạng thái sang **Hoàn thành**.

> [!IMPORTANT]
> Dashboard sẽ hiển thị cảnh báo nếu các hệ thống quan trọng có tỷ lệ tuân thủ tài liệu thấp.
