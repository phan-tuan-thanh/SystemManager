# Sprint 20 — Quản lý Phân vùng Mạng (Network Zones)

**Ngày bắt đầu:** 2026-05-18  
**Ngày kết thúc:** 2026-05-19  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Định nghĩa các phân vùng an ninh (Zones) và dải IP tương ứng để làm cơ sở cho việc thiết lập luật tường lửa.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: NetworkZone**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `code` | `String` | Mã vùng (VD: 'DMZ_PROD') | Unique per environment |
| `zone_type` | `Enum` | Loại (`DMZ`, `INTERNAL`, `DB`, ...) | |
| `color` | `String` | Màu nhận diện trên sơ đồ | Hex/CSS Color |

#### **Model: ZoneIpEntry**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `ip_address` | `String` | Địa chỉ IP hoặc Dải IP | VarChar(50) |
| `is_range` | `Boolean` | Có phải dải IP (CIDR)? | Default: `false` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Zoning Logic)
- **IP Range Overlap:** Khi thêm một dải IP vào Zone, Backend thực hiện kiểm tra tính hợp lệ của format CIDR và đảm bảo dải IP này không bị chồng lấn với các dải IP của các Zone khác trong cùng môi trường.

### 3.2. Tầng Frontend (Zoning UI)
- **Color Picker:** Tích hợp bộ chọn màu giúp Admin tùy chỉnh màu sắc cho từng Zone. Màu sắc này sẽ được đồng bộ lên sơ đồ Topology để phân biệt các vùng an ninh trực quan.
- **Zone IP Drawer:** Sử dụng Drawer bên phải để quản lý danh sách IP của từng Zone mà không làm mất ngữ cảnh của trang danh sách chính.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/network-zones` | `POST` | Tạo vùng mạng mới | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Zone Schema, CIDR logic, UI Color picker)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
