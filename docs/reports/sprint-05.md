# Sprint 05 — Cấu hình Mạng & Phát hiện Xung đột IP

**Ngày bắt đầu:** 2026-04-15  
**Ngày kết thúc:** 2026-04-16  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý cấu hình mạng cho các máy chủ. Đảm bảo tính duy nhất của địa chỉ IP trong từng môi trường và cung cấp công cụ tra cứu Reverse DNS/Domain nhanh chóng.

## 2. Kiến trúc Mạng (Network Architecture)

- **Model `NetworkConfig`:** Lưu trữ Private IP, Public IP, NAT IP, Subnet, Gateway và Domain.
- **Ràng buộc:** Một Server có thể có nhiều Interface mạng (eth0, eth1, v.v.).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Collision Detection Logic)
- **Phát hiện Xung đột (IP Conflict):** Trước khi lưu một bản ghi mạng, hệ thống kiểm tra sự tồn tại của `private_ip` trong cùng một `environment`.
  - Quy tắc: Có thể trùng IP giữa môi trường DEV và PROD, nhưng tuyệt đối không được trùng IP trong cùng một môi trường.
- **Domain Lookup:** Khi cập nhật Domain, backend thực hiện chuẩn hoá chuỗi để đảm bảo định dạng FQDN hợp lệ.

### 3.2. Tầng Frontend (Network Interface UI)
- **Giao diện Network Tab:** Hiển thị danh sách các card mạng gắn với Server.
- **Form Interface:** Hỗ trợ nhập liệu đầy đủ các thông số từ IP đến DNS/Gateway. Sử dụng cơ chế validate IP Format (`IPv4 Regex`) ngay tại ô nhập liệu.
- **Status Mapping:** Tự động hiển thị nhãn (Badge) phân loại IP (Private/Public/NAT) để kỹ thuật viên dễ dàng nhận diện luồng định tuyến.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/network-config` | `POST` | Cấu hình mạng mới cho Server | `OPERATOR` |
| `/network-config/check-conflict` | `GET` | Kiểm tra nhanh IP đã tồn tại chưa | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Conflict Error:** Backend trả về `409 Conflict` kèm theo thông tin Server hiện đang chiếm giữ IP đó để Admin có thể kiểm tra chéo.
- **Format Error:** Trả về `400 Bad Request` nếu IP không đúng định dạng IPv4.

## 6. Hướng dẫn Bảo trì & Debug

- **Troubleshooting:** Nếu không thể thêm IP, hãy kiểm tra trạng thái `deleted_at` của các bản ghi cũ trong DB (có thể IP đang bị "treo" bởi một server đã xoá mềm).

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Network Schema, Conflict detection logic, IP Validation, Network UI Tab)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
