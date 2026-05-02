# Sprint 19 — Quản lý Firewall Rules & Phê duyệt

**Ngày bắt đầu:** 2026-05-25  
**Ngày kết thúc:** 2026-05-27  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý yêu cầu mở cổng tường lửa (Firewall Rules) và luồng phê duyệt từ Quản trị viên.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: FirewallRule**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `action` | `Enum` | Hành động | `ALLOW`, `DENY` |
| `status` | `Enum` | Trạng thái | `ACTIVE`, `INACTIVE`, `PENDING_APPROVAL`, `REJECTED` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Approval Workflow:** Luật tạo mới luôn ở trạng thái `PENDING_APPROVAL`. Chỉ `ADMIN` mới có quyền gọi API approve để chuyển sang `ACTIVE`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/firewall-rules` | `POST` | Đề xuất luật mới | `OPERATOR` |
| `/api/v1/firewall-rules/:id/approve` | `PATCH` | Phê duyệt luật | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Firewall Schema, Approval logic, Rules UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
