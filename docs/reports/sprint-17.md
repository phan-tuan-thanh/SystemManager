# Sprint 17 — Công cụ Import Dữ liệu (Infrastructure Import)

**Ngày bắt đầu:** 2026-05-19  
**Ngày kết thúc:** 2026-05-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ import máy chủ và cấu hình hạ tầng từ file Excel/CSV với cơ chế Preview & Validation.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **DTO: ImportPreview**
| Field | Type | Description |
|---|---|---|
| `sessionId` | `String` | ID phiên làm việc tạm thời |
| `data` | `Json[]` | Dữ liệu sau khi parse |
| `errors` | `Json[]` | Danh sách lỗi logic |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Two-step Import:**
  - Bước 1: Parse file, validate logic và trả về preview (Lưu vào Redis/RAM tạm thời).
  - Bước 2: User xác nhận, hệ thống thực thi insert hàng loạt vào Database.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/import/preview` | `POST` | Tải file lên để xem trước | `OPERATOR` |
| `/api/v1/import/execute` | `POST` | Xác nhận import vào DB | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Excel parser, Validation engine, Preview UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
