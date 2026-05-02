# Sprint 05 — Cấu hình Mạng & IP Management

**Ngày bắt đầu:** 2026-04-16  
**Ngày kết thúc:** 2026-04-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý cấu hình giao diện mạng, IP (Private/Public/NAT) và cơ chế phát hiện xung đột cấu hình.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: NetworkConfig**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `interface` | `String` | Tên giao diện mạng (VD: 'eth0') | `VarChar(50)` |
| `private_ip` | `String` | Địa chỉ IP nội bộ | `VarChar(45)` |
| `public_ip` | `String` | Địa chỉ IP public | `VarChar(45)` |
| `nat_ip` | `String` | Địa chỉ IP NAT | `VarChar(45)` |
| `domain` | `String` | Tên miền | `VarChar(255)` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **IP Conflict Detection:** Hệ thống kiểm tra `private_ip` KHÔNG được phép tồn tại trên hai Server khác nhau trong cùng một `Environment`.
- **Validation:** Sử dụng `@IsIP()` từ `class-validator` để đảm bảo định dạng IP hợp lệ.

### 3.2. Tầng Frontend (Client-side Logic)
- **Inline Tab CRUD:** Quản lý cấu hình mạng trực tiếp trong tab chi tiết Server qua hook `useNetworkConfigs`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/network-configs` | `POST` | Thêm cấu hình mạng | `OPERATOR` |
| `/api/v1/network-configs/lookup-domain` | `GET` | Tìm server theo domain | `VIEWER` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useNetworkConfigs()` | `POST /api/v1/network-configs` | Hook quản lý cấu hình mạng. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **IP Conflict (Lỗi 409):** Ném lỗi khi IP đã được sử dụng.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi nhân bản (Clone) Server, các cấu hình IP cũ sẽ không được tự động sao chép để tránh xung đột.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Network Schema, Conflict logic, Domain search UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
