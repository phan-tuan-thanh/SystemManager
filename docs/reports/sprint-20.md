# Sprint 20 — Phân vùng Mạng (Network Zones)

**Ngày bắt đầu:** 2026-05-28  
**Ngày kết thúc:** 2026-05-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Định nghĩa các phân vùng mạng (DMZ, DB, PROD...) và quản lý dải IP thuộc từng vùng.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: NetworkZone**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `code` | `String` | Mã vùng | `Unique` |
| `zone_type` | `Enum` | Loại vùng | `LOCAL`, `DMZ`, `DB`, `PROD`... |

#### **Model / DTO: ZoneIpEntry**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `ip_address` | `String` | IP hoặc Dải IP | `Required` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Overlap Check:** Khi thêm dải IP vào Zone, hệ thống kiểm tra xem dải IP này có đang trùng lặp (overlap) với Zone khác trong cùng môi trường không.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/network-zones` | `POST` | Tạo phân vùng | `ADMIN` |
| `/api/v1/network-zones/:id/ips` | `POST` | Gắn IP vào vùng | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (Zone Schema, Overlap logic, Zone UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
