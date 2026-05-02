# Sprint 21 — Thực thi ChangeSet & Data Consistency

**Ngày bắt đầu:** 2026-05-31  
**Ngày kết thúc:** 2026-06-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cơ chế áp dụng các thay đổi từ ChangeSet vào dữ liệu chính thức đảm bảo tính toàn vẹn (Transactional).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Atomic Apply:** Tất cả các bản ghi trong một ChangeSet được thực thi bên trong một `Prisma.$transaction`. Nếu một bản ghi lỗi, toàn bộ thay đổi bị rollback.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/changesets/:id/apply` | `POST` | Thực thi thay đổi | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Transaction logic, Consistency checks, Result UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
