# Quản lý Phần mềm Hệ thống (System Software)

Module này quản lý danh mục các phần mềm nền tảng như Hệ điều hành (OS), Web Server, Database Engine, và các Middleware khác.

## Tại sao cần quản lý System Software?
- **Theo dõi vòng đời**: Biết được phiên bản nào sắp hết hạn hỗ trợ (EOS/EOL).
- **Thống kê quy mô**: Biết được có bao nhiêu server đang chạy RHEL 7.9 để lên kế hoạch nâng cấp.
- **Tuân thủ**: Đảm bảo các server sử dụng đúng danh mục phần mềm đã được phê duyệt.

## Các chức năng chính
1. **Khai báo loại phần mềm**: Phân loại theo OS, WebServer, DB, v.v.
2. **Quản lý phiên bản**: Ghi nhận chi tiết Version và ngày phát hành.
3. **Liên kết Server**: Khi xem chi tiết một Server, bạn có thể gán các System Software mà server đó đang cài đặt.

## Ví dụ cụ thể
- **Yêu cầu**: Thống kê danh sách các server đang chạy **Oracle Database 12c** để thực hiện vá lỗi bảo mật.
- **Thực hiện**:
    1. Vào trang **Phần mềm hệ thống**.
    2. Tìm đến mục **Oracle Database**.
    3. Chọn phiên bản **12c**.
    4. Hệ thống sẽ hiển thị danh sách tất cả Server và Application liên quan đang sử dụng phiên bản này.
