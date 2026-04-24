# Hướng dẫn Quản lý Người dùng & Phân quyền

Hệ thống sử dụng mô hình **RBAC (Role-Based Access Control)** kết hợp với **Nhóm người dùng** để quản lý quyền hạn một cách linh hoạt.

## Quản lý Người dùng (Users)

### 1. Các loại tài khoản
- **Local Account**: Tài khoản tạo trực tiếp trên hệ thống, đăng nhập bằng email/mật khẩu.
- **SSO Account**: Tài khoản đăng nhập qua Microsoft 365 (Azure AD).

### 2. Trạng thái tài khoản
- **Hoạt động (ACTIVE)**: Đang hoạt động bình thường.
- **Không hoạt động (INACTIVE)**: Tài khoản bị vô hiệu hóa (không thể đăng nhập nhưng dữ liệu vẫn được giữ lại cho Audit Log).
- **Bị khoá (LOCKED)**: Tài khoản bị khóa do vi phạm hoặc yêu cầu bảo mật.

## Quản lý Nhóm người dùng (User Groups)

Nhóm người dùng giúp gom nhóm các nhân viên theo phòng ban hoặc chức năng (ví dụ: Team Vận hành, Team Phát triển).

- **Role mặc định**: Mỗi nhóm có một role mặc định (ADMIN, OPERATOR, VIEWER). Khi thêm người dùng vào nhóm, họ sẽ tự động kế thừa role này.
- **Thành viên**: Bạn có thể thêm hoặc gỡ nhiều người dùng cùng lúc vào một nhóm.

## Vai trò (Roles) và Quyền hạn

| Vai trò | Quyền hạn |
|---|---|
| **ADMIN** | Toàn quyền hệ thống, quản lý người dùng, cấu hình module. |
| **OPERATOR** | Thêm, sửa, xóa dữ liệu nghiệp vụ (Server, App, Connection). |
| **VIEWER** | Chỉ xem dữ liệu, không được phép thay đổi. |

## Quy trình gán quyền (Best Practice)
1. Tạo các **Nhóm người dùng** phản ánh đúng cơ cấu tổ chức.
2. Gán **Role mặc định** phù hợp cho từng nhóm.
3. Thêm **Người dùng** vào các nhóm tương ứng.
4. Nếu một cá nhân cần quyền đặc biệt (ngoài quyền của nhóm), hãy gán **Role trực tiếp** cho cá nhân đó trong trang chi tiết User.

> [!CAUTION]
> Luôn tuân thủ nguyên tắc **"Quyền hạn tối thiểu"**: chỉ cấp quyền vừa đủ để người dùng hoàn thành công việc.
