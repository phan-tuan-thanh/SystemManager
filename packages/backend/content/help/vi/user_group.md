# Quản lý Nhóm người dùng (User Groups)

Hệ thống sử dụng cơ chế phân quyền dựa trên nhóm (Group-based Access Control) để đơn giản hóa việc quản trị quyền cho số lượng người dùng lớn.

## 1. Vai trò của Nhóm người dùng
- **Phân quyền tập trung**: Thay vì gán quyền cho từng cá nhân, bạn gán quyền cho nhóm.
- **Phân cấp quản lý**: Các nhóm có thể đại diện cho các phòng ban (ví dụ: `Đội Vận hành`, `Đội Phát triển`, `Đội Bảo mật`).

## 2. Các thao tác chính

### Tạo nhóm mới
1. Vào menu **Quản trị** > **Nhóm người dùng**.
2. Nhấn **Thêm nhóm**.
3. Nhập mã nhóm (ví dụ: `ADMIN_INFRA`) và tên nhóm.
4. Chọn danh sách người dùng thuộc nhóm này.

### Cấu hình quyền hạn cho nhóm
Trong chi tiết nhóm, bạn có thể gán các **Roles** (Vai trò) hệ thống:
- **ADMIN**: Quyền quản trị toàn hệ thống.
- **OPERATOR**: Quyền vận hành, thay đổi hạ tầng.
- **VIEWER**: Chỉ có quyền xem thông tin.

## 3. Ví dụ thực tế
**Kịch bản: Phân quyền cho đội Audit bên ngoài**
1. Tạo nhóm `EXTERNAL_AUDIT`.
2. Gán Role `VIEWER` cho nhóm này.
3. Thêm các tài khoản của bên Audit vào nhóm.
4. Thành viên nhóm này sẽ thấy được Dashboard, Topology và Audit Log nhưng không thể thực hiện bất kỳ thay đổi nào (nút Edit/Delete sẽ bị ẩn).

> [!TIP]
> Một người dùng có thể thuộc nhiều nhóm khác nhau. Quyền hạn cuối cùng của người dùng là tổng hợp tất cả quyền từ các nhóm mà họ tham gia.
