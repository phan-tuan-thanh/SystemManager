# Hướng dẫn Sơ đồ Topology (2D & 3D)

Module **Topology** cung cấp cái nhìn trực quan về toàn bộ hạ tầng kỹ thuật, giúp bạn hiểu rõ mối quan hệ giữa Server và Ứng dụng.

## Chế độ hiển thị

Hệ thống hỗ trợ hai chế độ hiển thị chính:

### 1. Sơ đồ 2D (Mặc định)
- Sử dụng mô hình đồ thị phẳng.
- **Node (Nút)**: Đại diện cho Server hoặc Ứng dụng. Màu sắc nút thể hiện trạng thái (Xanh: Hoạt động, Đỏ: Lỗi).
- **Edge (Cạnh)**: Đại diện cho kết nối giữa các ứng dụng. Nhãn trên cạnh hiển thị Protocol và Port.
- **Tương tác**: Bạn có thể kéo thả các nút, phóng to/thu nhỏ (zoom), và nhấn vào nút để xem thông tin chi tiết ở bảng bên phải.

### 2. Sơ đồ 3D
- Sử dụng công tắc chuyển đổi **2D/3D** ở thanh công cụ.
- Sơ đồ 3D cho phép bạn xoay không gian để nhìn rõ các tầng (layers): Tầng vật lý -> Tầng Server -> Tầng Ứng dụng.
- **Hiệu ứng**: Khi di chuột qua một ứng dụng, toàn bộ các kết nối liên quan sẽ được highlight để dễ quan sát.

## Các chức năng nâng cao

### Trạng thái Realtime
- Sơ đồ cập nhật trạng thái kết nối và server theo thời gian thực qua các thông báo (badge) ở góc màn hình.
- Nếu một kết nối bị gián đoạn, đường kẻ sẽ chuyển sang màu đỏ và có hiệu ứng nhấp nháy.

### Chụp ảnh sơ đồ (Snapshot)
- Bạn có thể chụp lại trạng thái sơ đồ tại một thời điểm nhất định để so sánh với tương lai bằng nút **Lưu bản chụp**.
- Sử dụng tính năng **Bản chụp** để duyệt lại danh sách các mốc thời gian trong quá khứ.

## Ví dụ sử dụng
- **Tra cứu tác động**: Khi cần bảo trì server `SRV-01`, hãy mở Topology, tìm server này và xem những ứng dụng nào đang chạy trên đó, từ đó biết được những dịch vụ nào sẽ bị ảnh hưởng.
- **Kiểm tra kết nối**: Nếu ứng dụng A không gọi được ứng dụng B, hãy kiểm tra đường nối giữa chúng trên sơ đồ 2D để xem trạng thái kết nối có hiển thị cảnh báo đỏ hay không.

> [!TIP]
> Sử dụng chuột phải hoặc các phím điều hướng để di chuyển mượt mà trong không gian 3D.
