# Sprint 05 — Cấu hình Mạng & IP Conflict Detection

**Ngày bắt đầu:** 2026-04-15  
**Ngày kết thúc:** 2026-04-16  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý hạ tầng mạng chi tiết (Network Interfaces) cho từng Server. Điểm then chốt là cơ chế **Phát hiện trùng lặp IP (IP Conflict Detection)** trong cùng một môi trường triển khai để đảm bảo an toàn hạ tầng.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `NetworkConfig`:**
  - `interface`: Tên card mạng (VD: eth0, ens33).
  - `private_ip`, `public_ip`, `nat_ip`: Các loại địa chỉ IP.
  - `dns`: Mảng các địa chỉ DNS Server.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Phát hiện Trùng IP (IP Conflict Detection)
- **Logic (`checkIpConflict`):**
  - Trước khi `CREATE` hoặc `UPDATE` thông tin mạng, hệ thống kiểm tra: `private_ip` mới có đang được sử dụng bởi bất kỳ Server nào khác **trong cùng một Environment** (VD: PROD) hay không?
  - Nếu có, hệ thống ném lỗi `409 Conflict` kèm tên Server đang chiếm giữ IP đó.
- **Phạm vi:** Chỉ kiểm tra trùng IP trong cùng môi trường. Các môi trường khác nhau (VD: DEV và UAT) được phép dùng trùng dải IP (tương ứng với hạ tầng thực tế).

### 3.2. Ràng buộc Xoá Mạng (Safe Delete)
- Hệ thống chặn việc xoá cấu hình mạng nếu Server đó đang có các ứng dụng (AppDeployments) ở trạng thái **RUNNING**. Điều này ngăn chặn việc ngắt kết nối mạng của một Server đang hoạt động.

### 3.3. Lookup Domain (Tìm kiếm ngược)
- API `lookupDomain` cho phép tìm kiếm nhanh các Server/App liên quan đến một domain cụ thể, phục vụ việc truy vết nhanh khi có sự cố DNS.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Payload | Chức năng | Quyền |
|---|---|---|---|---|
| `/network` | `POST` | `CreateNetworkConfigDto` | Tạo cấu hình mạng (check conflict) | `OPERATOR` |
| `/network/lookup` | `GET` | `?domain=xxx` | Tìm tài nguyên theo domain | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **IP Conflict Error:** Thông báo lỗi chi tiết: `IP X is already assigned to server Y (Code Z) in PROD environment`.

## 6. Hướng dẫn Bảo trì & Debug

- **Validate IP:** Hệ thống sử dụng `class-validator` với decorator `@IsIP()` tại DTO để đảm bảo dữ liệu đầu vào luôn đúng định dạng IPv4/IPv6.

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (Network Schema, Conflict Detection logic, Domain Lookup, IP Validation)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
