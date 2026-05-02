# Sprint 20 — Quản lý Phân vùng Mạng (Network Zones)

**Ngày bắt đầu:** 2026-05-18  
**Ngày kết thúc:** 2026-05-19  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Định nghĩa các vùng an ninh mạng (Security Zones) và quản lý dải IP (VLAN) tương ứng. Đây là nền tảng để phân loại Server theo mức độ bảo mật.

## 2. Kiến trúc Phân vùng (Zoning Architecture)

- **Model `NetworkZone`:** Lưu tên vùng (VD: DMZ, APP, DB), dải IP (`10.x.x.x`) và màu sắc nhận diện.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Zoning Logic)
- **IP Range Overlap Check:** Khi khai báo một vùng mạng mới, backend kiểm tra dải IP của vùng đó có bị chồng lấn (Overlap) với các vùng hiện có hay không.
- **Zone Association:** Tự động gán nhãn vùng mạng cho Server dựa trên địa chỉ IP của Server đó (logic `findZoneByIp`).

### 3.2. Tầng Frontend (Zoning UI)
- **Color Coding:** Cho phép chọn màu sắc đặc trưng cho từng Zone để dễ dàng nhận diện trên sơ đồ Topology và danh sách Server.
- **Zone Dashboard:** Hiển thị số lượng Server đang nằm trong từng vùng mạng dưới dạng các thẻ (Card) trực quan.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/network-zones` | `GET` | Lấy danh sách vùng mạng | `VIEWER` |
| `/network-zones` | `POST` | Khai báo vùng mới | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Zone Schema, Overlap logic, Zone UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
