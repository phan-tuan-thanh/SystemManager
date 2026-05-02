# Sprint 05 — Cấu hình Mạng & IP Management

**Ngày bắt đầu:** 2026-04-16  
**Ngày kết thúc:** 2026-04-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý cấu hình giao diện mạng, IP (Private/Public/NAT) và cơ chế phát hiện xung đột cấu hình trong hệ thống hạ tầng.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: NetworkConfig**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `interface` | `String` | Tên giao diện mạng (VD: 'eth0') | `VarChar(50)` |
| `private_ip` | `String` | Địa chỉ IP nội bộ | `VarChar(45)` (Hỗ trợ IPv6) |
| `public_ip` | `String` | Địa chỉ IP public | `VarChar(45)` |
| `domain` | `String` | Tên miền gắn với IP | `VarChar(255)` |
| `dns` | `String[]` | Danh sách DNS server | Mảng các chuỗi |

#### **Hằng số & Enums (Constants & Options)**
- `NetworkConflictCode`: Mã lỗi chuyên biệt trả về FE (VD: `ERR_IP_CONFLICT`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **IP Conflict Detection Rules:** Trước khi lưu một `NetworkConfig` mới, DB thực hiện query kiểm tra `private_ip`. Quy tắc: Một `private_ip` KHÔNG được phép tồn tại trên hai Server khác nhau nếu hai Server này thuộc cùng chung một `Environment` (VD: PROD). 

### 3.2. Tầng Frontend (Client-side Logic)
- **Inline Tab CRUD:** Tại trang chi tiết Server, tab "Network" cung cấp một danh sách (Table). Khi nhấn "Thêm", một Modal hiện ra để thao tác nhanh mà không cần chuyển trang. 
- **Domain Search Bar:** Bổ sung thanh tra cứu nhanh (Lookup) cho phép nhập Domain để tìm ngược ra Server chứa IP được trỏ tới.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/network-configs` | `POST` | Khai báo IP mới kèm kiểm tra xung đột | `OPERATOR` |
| `/api/v1/network-configs/lookup-domain` | `GET` | Tìm server dựa vào Domain | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **IP Conflict (Lỗi 409):** Hệ thống trả về `ConflictException` với thông điệp: "IP 10.0.0.1 đã được sử dụng bởi Server SRV-001 trong môi trường PROD".
- **Invalid IP Format (Lỗi 400):** DTO Validator (`class-validator`) kiểm tra `@IsIP()` trước khi vào controller. Sai định dạng sẽ bị từ chối ngay.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi Clone một Server, Backend không tự động clone NetworkConfig vì sẽ vi phạm luật Conflict IP.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Network Schema, IP Validation logic, Domain search UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
