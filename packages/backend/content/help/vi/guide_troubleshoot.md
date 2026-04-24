# Quy trình Kiểm tra & Xử lý sự cố

Hệ thống cung cấp các công cụ trực quan để bạn nhanh chóng tìm ra nguyên nhân gây gián đoạn dịch vụ.

## 1. Kiểm tra trạng thái Realtime trên Topology
Khi nhận được thông tin một ứng dụng gặp lỗi kết nối:
1. Vào menu **Giám sát** > **Topology 2D**.
2. Tìm ứng dụng đang gặp vấn đề (sử dụng ô Tìm kiếm).
3. Quan sát màu sắc:
    - **Nút màu đỏ**: Server hoặc Ứng dụng đang ở trạng thái lỗi/dừng.
    - **Đường kẻ màu đỏ/nhấp nháy**: Kết nối giữa 2 ứng dụng đang bị gián đoạn hoặc không ổn định.

## 2. Truy vết lịch sử thay đổi (Audit Log)
Nếu hệ thống đang chạy bình thường đột nhiên gặp lỗi, rất có thể do ai đó vừa thay đổi cấu hình.
1. Vào menu **Giám sát** > **Audit Log**.
2. Lọc theo thời gian (ví dụ: 30 phút gần nhất).
3. Lọc theo loại tài nguyên nghi ngờ (ví dụ: `Server` hoặc `Connection`).
4. Xem chi tiết **Giá trị cũ** và **Giá trị mới** để biết chính xác thông số nào đã bị đổi.

## 3. So sánh với trạng thái ổn định (Snapshot)
1. Trong trang Topology, nhấn vào nút **Bản chụp**.
2. Chọn một thời điểm trong quá khứ khi hệ thống vẫn đang chạy tốt.
3. So sánh cấu hình và sơ đồ giữa "Quá khứ" và "Hiện tại" để tìm ra sự khác biệt.

## 4. Kiểm tra hồ sơ tuân thủ (Compliance)
Đôi khi lỗi xảy ra do ứng dụng chưa được cập nhật đầy đủ tài liệu vận hành hoặc quy trình bảo mật.
1. Vào chi tiết **Deployment** của ứng dụng đó.
2. Kiểm tra tab **Tài liệu**.
3. Nếu có các tài liệu trạng thái "Chờ upload", hãy yêu cầu đội phát triển bổ sung để đảm bảo tuân thủ quy trình vận hành.

> [!TIP]
> Luôn sử dụng tính năng Export báo cáo Topology (PNG/PDF) sau mỗi lần xử lý sự cố để lưu vào hồ sơ kỹ thuật.
