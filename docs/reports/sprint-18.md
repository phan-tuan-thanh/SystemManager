# Sprint 18 — Import Nâng cao (Deployments & Ports)

**Ngày bắt đầu:** 2026-05-22  
**Ngày kết thúc:** 2026-05-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Mở rộng công cụ import cho hồ sơ triển khai (Deployments) và danh mục Port dịch vụ.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Smart Mapping:** Tự động ánh xạ `Application Code` và `Server Code` trong file import thành ID thực tế trong DB.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/import/preview?type=deployment` | `POST` | Preview cho deployment | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Mapping logic, Port regex parser)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
