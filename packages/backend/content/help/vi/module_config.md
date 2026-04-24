# Quản lý Modules (Module Configuration)

Trang này cho phép quản trị viên kiểm soát các module chức năng của hệ thống và quản lý tính phụ thuộc giữa chúng.

## 1. Module là gì?
Module là các khối chức năng logic của SystemManager:
- **Module Core**: Các chức năng bắt buộc (ví dụ: `Auth`, `User`, `SystemConfig`). Các module này không thể bị tắt để đảm bảo hệ thống luôn hoạt động.
- **Module Mở rộng**: Các chức năng bổ sung (ví dụ: `Topology`, `AuditLog`, `Compliance`). Bạn có thể bật hoặc tắt các module này tùy theo nhu cầu sử dụng của tổ chức.

## 2. Quản lý trạng thái và Phụ thuộc
Mỗi module có thể phụ thuộc vào một hoặc nhiều module khác:
- **Khi bật một module**: Hệ thống sẽ kiểm tra xem các module phụ thuộc đã được bật chưa. Nếu chưa, bạn phải bật các module đó trước.
- **Khi tắt một module**: Hệ thống sẽ cảnh báo nếu có các module khác đang phụ thuộc vào nó. Việc tắt một module "gốc" sẽ ảnh hưởng đến hoạt động của các module "ngọn".

## 3. Các thao tác chính
1. Vào menu **Quản trị** > **Modules**.
2. Tại danh sách module, sử dụng nút gạt (Switch) để thay đổi trạng thái:
    - **Màu xanh (Enabled)**: Module đang hoạt động.
    - **Màu xám (Disabled)**: Module đã bị vô hiệu hóa.

> [!IMPORTANT]
> Việc thay đổi trạng thái module có hiệu lực ngay lập tức đối với tất cả người dùng trong hệ thống.

> [!TIP]
> Nếu bạn không thấy một menu chức năng nào đó ở Sidebar, hãy kiểm tra xem module tương ứng đã được bật chưa.
