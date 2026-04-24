# Quản lý Mạng và Kết nối (Networks)

Module này giúp bạn quản lý các phân vùng mạng (Subnets), VLAN và các kết nối vật lý/logic giữa các thiết bị.

## 1. Phân vùng mạng (Subnets/VLANs)
- Quản lý danh sách các dải IP đang sử dụng.
- Phân loại mạng theo mục đích: `Internal`, `External`, `DMZ`, `Management`.

## 2. Quản lý IP (IPAM)
- Khi khai báo Server, bạn có thể chọn IP từ các dải mạng đã định nghĩa.
- Hệ thống tự động cảnh báo nếu có sự trùng lặp IP hoặc IP nằm ngoài dải quy định.

## 3. Sơ đồ kết nối mạng
- Tích hợp với **Topology** để hiển thị luồng dữ liệu đi qua các phân vùng mạng.
- Giúp xác định các điểm nghẽn hoặc các lỗ hổng bảo mật khi có kết nối trái phép giữa các vùng (ví dụ: Từ `External` đi trực tiếp vào `Database` mà không qua `App`).

## 4. Ví dụ thực tế
**Kịch bản: Khai báo dải mạng mới cho dự án ERP**
1. Vào trang **Mạng**.
2. Nhấn **Thêm dải mạng**.
3. Nhập CIDR: `10.20.30.0/24`.
4. Gán nhãn dự án: `ERP_PRODUCTION`.
5. Khi tạo Server cho dự án ERP, hệ thống sẽ gợi ý các IP trống trong dải này.

> [!TIP]
> Bạn có thể đính kèm sơ đồ network (Visio/PNG) vào từng dải mạng để lưu trữ tài liệu kỹ thuật tập trung.
