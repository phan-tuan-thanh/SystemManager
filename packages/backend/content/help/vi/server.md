# Hướng dẫn Quản lý Server

Module **Quản lý Server** cho phép bạn theo dõi và cấu hình toàn bộ danh sách máy chủ trong hệ thống, bao gồm cả máy chủ vật lý, máy chủ ảo (VM), và container.

## Các chức năng chính

### 1. Xem danh sách Server
- Truy cập menu **Server** từ thanh điều hướng bên trái.
* Danh sách hiển thị theo các tab môi trường: **DEV**, **UAT**, **PROD**.
* Bạn có thể lọc server theo: Tên, Hostname, Loại hạ tầng, hoặc Trạng thái.

### 2. Thêm mới Server
1. Nhấn nút **Thêm Server** ở góc trên bên phải.
2. Điền các thông tin cơ bản:
    - **Mã server**: Mã định danh duy nhất (ví dụ: `SRV-WEB-01`).
    - **Tên server**: Tên gợi nhớ.
    - **Môi trường**: Chọn môi trường triển khai.
3. Nhấn **Lưu** để hoàn thành.

### 3. Quản lý chi tiết Server
- Nhấn vào tên server trong danh sách để xem chi tiết.
- Các tab thông tin bao gồm:
    - **Thông tin**: Cấu hình cơ bản (Mã, Hostname, Môi trường, Trạng thái).
    - **Phần cứng**: Quản lý CPU, RAM, Ổ cứng và các linh kiện vật lý.
    - **Network**: Quản lý IP, Domain, VLAN.
    - **Ứng dụng**: Danh sách các ứng dụng đang triển khai trên server này.
    - **Lịch sử thay đổi**: Xem lại các thay đổi cấu hình theo thời gian.

## Ví dụ thực tế

### 1. Quản lý phần cứng
- **Yêu cầu**: Bạn cần ghi nhận việc nâng cấp RAM cho server `DB-PROD-01`.
- **Thực hiện**:
    1. Vào chi tiết server `DB-PROD-01`.
    2. Tại tab **Phần cứng**, nhấn **Thêm linh kiện**.
    3. Chọn loại `RAM`, nhập thông tin `64GB DDR4`, serial number và ngày lắp đặt.
    4. Hệ thống sẽ tự động cộng dồn vào tổng dung lượng tài nguyên của server.

### 2. Quản lý mạng (Network)
- **Yêu cầu**: Khai báo địa chỉ IP quản trị (iLO/OOB) cho một server vật lý.
- **Thực hiện**:
    1. Tại tab **Network**, thêm một bản ghi mới.
    2. Nhập IP (ví dụ: `10.20.30.40`), chọn kiểu kết nối `OOB/Management`.
    3. Gán vào VLAN tương ứng.
    4. Bây giờ bạn có thể nhấn trực tiếp vào link IP này trên giao diện để mở trang quản trị server.

> [!TIP]
> Luôn giữ trạng thái Server là **Bảo trì** khi đang thực hiện thay thế linh kiện vật lý để tránh các cảnh báo giả từ hệ thống giám sát.

> [!TIP]
> Sử dụng **Audit Log** để kiểm tra ai là người cuối cùng thay đổi cấu hình của server nếu có sự cố xảy ra.
