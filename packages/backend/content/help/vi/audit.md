# Hướng dẫn Audit Log & Lịch sử thay đổi

Hệ thống ghi lại mọi thao tác của người dùng để đảm bảo tính minh bạch và phục vụ công tác giám sát hạ tầng.

## Audit Log là gì?

Mỗi hành động **Thêm**, **Sửa**, hoặc **Xóa** bất kỳ đối tượng nào (Server, App, User...) đều được hệ thống ghi lại thành một bản ghi Audit Log.

## Các chức năng chính

### 1. Tra cứu lịch sử thao tác
- Truy cập menu **Audit Log**.
- Bạn có thể tìm kiếm và lọc bản ghi theo:
    - **Người thực hiện**: Ai là người thao tác?
    - **Hành động**: Create, Update hay Delete?
    - **Loại tài nguyên**: Server, Application, Network...
    - **Thời gian**: Khoảng thời gian xảy ra thao tác.

### 2. Xem chi tiết thay đổi (Diff View)
- Nhấn vào một bản ghi trong danh sách để xem chi tiết.
- Hệ thống hiển thị so sánh:
    - **Giá trị cũ**: Trạng thái của đối tượng trước khi thay đổi.
    - **Giá trị mới**: Trạng thái của đối tượng sau khi thay đổi.
- Các trường có sự thay đổi sẽ được highlight để dễ quan sát.

### 3. Xuất báo cáo (Export)
- Bạn có thể xuất danh sách Audit Log ra file **CSV** để phục vụ báo cáo hoặc kiểm toán định kỳ bằng nút **Export CSV**.

## Lịch sử thay đổi (Change History) theo từng đối tượng
Ngoài trang Audit Log tổng hợp, bạn có thể xem lịch sử riêng của từng server hoặc ứng dụng:
1. Vào trang chi tiết của một Server hoặc Ứng dụng.
2. Chọn tab **Lịch sử thay đổi**.
3. Tại đây bạn sẽ thấy dòng thời gian (timeline) các thay đổi chỉ riêng cho đối tượng đó.

## Ví dụ thực tế: Truy vết thay đổi cấu hình

**Tình huống**: Ứng dụng `Payment-Gateway` đột ngột không kết nối được tới Database. Bạn nghi ngờ có ai đó đã thay đổi IP của server database.

**Các bước thực hiện**:
1. Truy cập **Audit Log**.
2. Thiết lập bộ lọc:
    - **Loại tài nguyên**: `NetworkConfig` (vì IP nằm trong cấu hình mạng).
    - **Hành động**: `UPDATE`.
    - **Thời gian**: Chọn khoảng 1 giờ trước khi xảy ra sự cố.
3. Tìm bản ghi liên quan đến IP của database server.
4. Nhấn **Xem chi tiết** (icon mắt).
5. Trong bảng **Thay đổi dữ liệu**, bạn thấy:
    - `Giá trị cũ`: `ip_address: "10.0.1.10"`
    - `Giá trị mới`: `ip_address: "10.0.1.20"`
6. Bạn xác định được chính xác **ai** đã thực hiện thay đổi và vào lúc **mấy giờ**.

> [!TIP]
> Sử dụng Audit Log kết hợp với Topology Snapshot để hiểu rõ lý do tại sao sơ đồ hạ tầng thay đổi vào một thời điểm nhất định.
