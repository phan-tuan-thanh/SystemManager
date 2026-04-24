# Hướng dẫn Import dữ liệu hạ tầng (CSV)

Hệ thống cung cấp công cụ import hàng loạt để bạn nhanh chóng khai báo danh sách Server, Ứng dụng và Port từ file CSV.

## Các bước thực hiện

### 1. Chuẩn bị file CSV
- Nhấn vào khu vực **Nhấn hoặc kéo thả file CSV hoặc Excel...** để chọn file.
- Đảm bảo file có các cột bắt buộc tùy theo loại đối tượng (Server, Ứng dụng, hoặc Deployment).
- Dòng đầu tiên phải là tiêu đề cột.

### 2. Tải lên và Rà soát (Xem trước & Kiểm tra)
- Sau khi chọn file, hệ thống tự động chuyển sang bước **Xem trước & Kiểm tra**.
- **Tổng số dòng**, **Hợp lệ** và **Không hợp lệ** được thống kê rõ ràng.
- **Quan trọng**: Các dòng có dữ liệu lỗi (Invalid) sẽ được highlight màu đỏ trong bảng. Bạn nên sửa lại file và tải lại (Nhấn **Quay lại**) để đảm bảo dữ liệu chính xác.

### 3. Chọn tham số (Tùy chọn)
Trước khi tải file, bạn có thể chọn các tham số áp dụng:
- **Loại đối tượng**: Server, Ứng dụng, hoặc Deployment.
- **Môi trường**: DEV, UAT hoặc PROD (chỉ áp dụng cho Server và Ứng dụng).

### 4. Thực hiện Nhập dữ liệu
- Nhấn nút **Nhập X dòng hợp lệ**.
- Sau khi hoàn tất, hệ thống sẽ hiển thị thông báo **Hoàn tất**:
    - Số lượng bản ghi đã nhập thành công.
    - Số lượng bản ghi bị bỏ qua.
    - Danh sách các lỗi chi tiết phát sinh trong quá trình xử lý.

## Lưu ý quan trọng
- Hệ thống sử dụng **IP** để xác định server và **AppName** để xác định ứng dụng. 
- Nếu IP đã tồn tại, hệ thống sẽ cập nhật thông tin cho server đó thay vì tạo mới.
- Port sẽ được gán vào đúng cặp Server x Application tương ứng.

> [!TIP]
> Bạn nên thử nghiệm import với một vài dòng dữ liệu ở môi trường **DEV** trước khi thực hiện import quy mô lớn trên **PROD**.
