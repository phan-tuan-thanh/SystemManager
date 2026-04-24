# Quản lý Kết nối giữa các Ứng dụng (Connections)

Module này quản lý các luồng dữ liệu (Data Flows) giữa các thành phần trong hệ thống. Đây là cơ sở để vẽ sơ đồ **Topology**.

## 1. Thành phần của một kết nối
- **Nguồn (Source)**: Ứng dụng gửi yêu cầu.
- **Đích (Target)**: Ứng dụng hoặc Server nhận yêu cầu.
- **Cổng (Port)**: Cổng dịch vụ đang kết nối.
- **Giao thức**: TCP, UDP, HTTP, HTTPS, v.v.

## 2. Các trạng thái kết nối
- **Active**: Kết nối đang hoạt động bình thường.
- **Pending**: Kết nối đã khai báo nhưng chưa được kiểm tra thực tế.
- **Deprecated**: Kết nối cũ, chuẩn bị loại bỏ.
- **Blocked**: Kết nối bị tường lửa ngăn chặn (được ghi nhận để giám sát).

## 3. Cách tạo kết nối
1. **Thủ công**: Vào trang **Connections** > **Thêm kết nối**.
2. **Từ Topology**: Kéo thả từ ứng dụng này sang ứng dụng kia trong sơ đồ 2D.
3. **Từ Import**: Nạp file CSV chứa danh sách các luồng dữ liệu.

## 4. Ví dụ thực tế
**Kịch bản: Khai báo kết nối từ Web sang Database**
1. Nguồn: `Web-Frontend`.
2. Đích: `SQL-Server-01`.
3. Port: `1433`.
4. Giao thức: `TCP`.
5. Sau khi lưu, sơ đồ Topology sẽ tự động xuất hiện một đường kẻ nối từ `Web-Frontend` đến `SQL-Server-01`.

> [!TIP]
> Bạn có thể thêm ghi chú về loại dữ liệu truyền tải (ví dụ: `Thông tin đơn hàng`) để giúp đội vận hành dễ dàng tra cứu khi có sự cố.
