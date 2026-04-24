# Quản lý Hệ thống Hạ tầng (Infra Systems)

**Infra System** là cấp quản lý cao nhất, đại diện cho một dự án hoặc một mảng nghiệp vụ lớn trong tổ chức.

## Quản lý theo cấu trúc hình cây
- Một **Infra System** chứa nhiều **Application**.
- Mỗi **Application** lại có nhiều bản **Deployment** trên các **Server**.

## Các thông tin quản lý
- **Mã hệ thống**: Viết tắt (ví dụ: `CORE`, `ECOM`).
- **Chủ quản**: Phòng ban hoặc cá nhân chịu trách nhiệm chính.
- **Phạm vi**: Danh sách các server thuộc hệ thống này.

## Quy trình vận hành
1. **Khai báo**: Tạo mới hệ thống khi có dự án mới bắt đầu.
2. **Gán tài nguyên**: Phân bổ server và đội ngũ vận hành cho hệ thống.
3. **Giám sát**: Theo dõi tổng thể sức khỏe và mức độ tuân thủ của toàn bộ mảng nghiệp vụ.

## Ví dụ thực tế
**Tình huống: Bàn giao tài liệu cho đội kiểm toán**
1. Vào trang **Hệ thống hạ tầng**.
2. Chọn hệ thống **E-Commerce**.
3. Sử dụng tính năng **Export Report** để xuất toàn bộ danh sách Server, App và trạng thái tài liệu của riêng hệ thống này thay vì xuất toàn bộ tổ chức.
4. Báo cáo này giúp chứng minh mức độ tuân thủ quy trình vận hành của riêng dự án E-Commerce.

> [!IMPORTANT]
> Việc xóa một Infra System sẽ không xóa các Server liên quan nhưng sẽ làm mất mối liên kết logic giữa chúng.
