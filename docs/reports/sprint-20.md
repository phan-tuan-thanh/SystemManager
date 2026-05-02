# Sprint 20 — Quản lý Phân vùng Mạng (Network Zones)

**Ngày bắt đầu:** 2026-05-18  
**Ngày kết thúc:** 2026-05-19  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Định nghĩa các phân vùng an ninh (Zones) và dải IP tương ứng để làm cơ sở cho việc nhóm thiết bị và áp dụng luật tường lửa hàng loạt.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: NetworkZone**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã vùng | `Unique` trên mỗi Environment |
| `zone_type` | `Enum` | Phân loại phân vùng | `DMZ`, `INTERNAL`, `DB`, `CUSTOM` |
| `color` | `String` | Mã màu hiển thị | Định dạng HEX |

#### **Model / DTO: ZoneIpEntry**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `ip_address` | `String` | Dải IP / Subnet | `VarChar(50)` |
| `is_range` | `Boolean` | Định dạng IP đơn hay dải? | `Default: false` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **IP Range Overlap Validator:** Khi thêm một `ZoneIpEntry` kiểu `is_range = true` (định dạng CIDR như `10.0.0.0/24`), service chạy thư viện `ipaddr.js` để tính toán. Nếu phát hiện dải subnet này bị chồng lấn (overlap) một phần hoặc toàn phần với dải subnet của một Zone khác trong cùng môi trường, yêu cầu sẽ bị chặn lại.

### 3.2. Tầng Frontend (Client-side Logic)
- **Zone Drawer:** Tab quản lý `ZoneIpEntry` nằm trong một `Drawer` bật ra từ sườn phải thay vì load trang mới, đảm bảo trải nghiệm liên tục cho người dùng.
- **Color Picker Integration:** Bảng màu định nghĩa Zone sử dụng thư viện `react-color`. Màu này được đồng bộ vào cấu hình ReactFlow để tự động phủ nền phân nhóm (Group Nodes) trên sơ đồ Topology.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/network-zones` | `POST` | Khởi tạo phân vùng mạng | `ADMIN` |
| `/api/v1/network-zones/:id/ips` | `POST` | Gắn dải IP vào vùng kèm Check Overlap | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Subnet Overlap (Lỗi 409):** Báo lỗi "Dải IP 10.0.0.0/24 trùng lặp với vùng DMZ".

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi xoá một Zone, mặc định các IP Entry bên trong sẽ tự động bị xoá theo cơ chế Cascade, nhưng các FirewallRule dùng Zone này sẽ chuyển thành `INACTIVE`.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Zone Schema, CIDR logic, UI Color picker)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
