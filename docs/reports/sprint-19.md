# Sprint 19 — Quản lý Firewall Rule & Phân quyền thao tác

**Ngày bắt đầu:** 2026-05-16  
**Ngày kết thúc:** 2026-05-17  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý tập trung các quy tắc tường lửa (Firewall Rules). Đảm bảo kiểm soát chặt chẽ luồng truy cập giữa các vùng mạng và tích hợp phân quyền thao tác (RBAC) cho đội ngũ vận hành.

## 2. Kiến trúc Bảo mật (Security Architecture)

- **Model `FirewallRule`:** Lưu thông tin Source IP/Zone, Destination Server/Port, và hành động (`ALLOW`/`DENY`).
- **RBAC UI:** Ẩn/Hiện chức năng dựa trên quyền thực tế của người dùng (`ADMIN`, `OPERATOR`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Access Control Logic)
- **Role-based Permission:** Backend sử dụng `RolesGuard` để bảo vệ các endpoint `POST/PATCH/DELETE`. Chỉ người dùng có quyền `ADMIN` hoặc `OPERATOR` mới có thể thay đổi luật firewall.
- **Relational Validation:** Khi tạo rule, backend kiểm tra tính hợp lệ của cặp IP/Server đích. Nếu IP đích không thuộc Server đã chọn, hệ thống sẽ cảnh báo không nhất quán dữ liệu.

### 3.2. Tầng Frontend (Admin Control UI)
- **Giao diện Quản trị tập trung:** Hiển thị danh sách Rule dưới dạng bảng với các thẻ màu phân loại môi trường (`PROD` - đỏ, `DEV` - xanh).
- **Hệ thống lọc đa tầng:** Hỗ trợ lọc đồng thời theo Môi trường, Hành động (Allow/Deny) và Trạng thái (Active/Pending).
- **Import/Export XLSX:** Tích hợp bộ thư viện xử lý file chuyên sâu để xuất danh sách luật ra Excel phục vụ việc rà soát an ninh định kỳ.
- **Conditional UI:** Nút "Tạo mới" và "Chỉnh sửa" tự động bị ẩn đối với người dùng chỉ có quyền `VIEWER`, đảm bảo an toàn tuyệt đối cho cấu hình hạ tầng.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/firewall-rules` | `GET` | Tra cứu danh sách luật | `VIEWER` |
| `/firewall-rules` | `POST` | Đăng ký luật mới | `OPERATOR` |
| `/firewall-rules/export` | `GET` | Xuất file XLSX | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Forbidden Action:** Trả về `403 Forbidden` nếu một user VIEWER cố gắng gọi API xoá rule qua Postman.
- **Duplicate Rule:** Backend kiểm tra trùng lặp luật (Source/Target/Port giống hệt nhau) để tránh rác dữ liệu.

## 6. Hướng dẫn Bảo trì & Debug

- **Audit Log:** Mọi thay đổi về Firewall Rule đều được ghi vết Snapshot chi tiết để phục vụ điều tra an ninh.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Firewall Schema, RBAC logic, XLSX Export, Management UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
