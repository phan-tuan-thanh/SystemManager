# Sprint 05 — Cấu hình Mạng & IP Management

**Ngày bắt đầu:** 2026-04-16  
**Ngày kết thúc:** 2026-04-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý các cấu hình giao diện mạng, địa chỉ IP (Private/Public/NAT) và phát hiện xung đột cấu hình trong hệ thống.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: NetworkConfig**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `interface` | `String` | Tên giao diện (VD: 'eth0', 'ens192') | |
| `private_ip` | `String` | Địa chỉ IP nội bộ | VarChar(45) |
| `public_ip` | `String` | Địa chỉ IP public | |
| `nat_ip` | `String` | Địa chỉ IP sau NAT | |
| `domain` | `String` | Tên miền gắn với IP này | |
| `dns` | `String[]` | Danh sách DNS server | Mảng các chuỗi |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (IP Conflict Detection)
- **Ràng buộc duy nhất theo môi trường:** Một địa chỉ `private_ip` không được phép xuất hiện lặp lại trên hai server khác nhau trong cùng một **Môi trường (Environment)**. 
- **Validation Logic:** Trước khi lưu, Backend thực hiện query kiểm tra tồn tại IP. Nếu phát hiện trùng lặp, trả về lỗi `409 Conflict` kèm thông tin Server đang chiếm giữ IP đó.

### 3.2. Tầng Frontend (Interface Config)
- **Inline CRUD:** Trong trang chi tiết Server, tab "Network" cho phép thêm/sửa/xoá các dòng cấu hình IP trực tiếp mà không cần chuyển trang.
- **Domain Lookup:** Tính năng tra cứu nhanh từ Domain sang Server giúp kỹ sư vận hành xác định nhanh server đích khi nhận được phản ánh về lỗi truy cập tên miền.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/network-configs` | `POST` | Khai báo IP mới (kiểm tra trùng) | `OPERATOR` |
| `/network-configs/lookup-domain` | `GET` | Tìm server theo domain | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Network Schema, IP Validation logic, Domain search UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
