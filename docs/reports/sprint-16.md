# Sprint 16 — Refactoring & Performance Optimization

**Ngày bắt đầu:** 2026-05-16  
**Ngày kết thúc:** 2026-05-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tối ưu hóa truy vấn dữ liệu, chuẩn hóa cấu trúc thư mục và cải thiện tốc độ render Frontend.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

*(Không thay đổi Schema)*

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Eager Loading Optimization:** Sử dụng `select` thay vì `include` trong Prisma để giảm lượng data thừa.
- **Index Review:** Thêm index cho các trường hay query: `created_at`, `status`, `environment`.

### 3.2. Tầng Frontend (Client-side Logic)
- **Code Splitting:** Sử dụng `React.lazy` cho các Route trang để giảm bundle size ban đầu.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/applications` | `GET` | Thêm param filter theo type | `VIEWER` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useApplications()` | N/A | Cập nhật logic filter phía client. |

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Index optimization, Lazy loading, Bundle analysis)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
