# Sprint 16 — Phân loại Nhóm & Hợp nhất Catalog

**Ngày bắt đầu:** 2026-05-19  
**Ngày kết thúc:** 2026-05-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tái cấu trúc (Refactor) Database để hợp nhất phần mềm hệ thống và ứng dụng nghiệp vụ vào chung một luồng quản lý, phân tách logic qua cờ phân loại (Flag).

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Application (Refactored)**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `application_type` | `Enum` | Xác định luồng | `BUSINESS`, `SYSTEM` |
| `sw_type` | `Enum` | Phân loại phần mềm nền | `OS`, `MIDDLEWARE`, `DATABASE` |
| `vendor` | `String` | Nhà sản xuất | Dành cho app SYSTEM |
| `eol_date` | `DateTime` | Hạn hỗ trợ (End of Life) | Dành cho app SYSTEM |

#### **Model / DTO: ApplicationGroup (Refactored)**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `group_type` | `Enum` | Loại nhóm | `BUSINESS`, `INFRASTRUCTURE` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Data Migration Logic:** Thay vì đập bỏ bảng `SystemSoftware`, một script migration (Prisma migrate) chạy lệnh gộp tất cả data từ bảng cũ vào bảng `Application` với cờ `application_type = SYSTEM`.
- **Validation Refactoring:** Cập nhật DTO. Nếu type là `SYSTEM`, bắt buộc phải check các trường `vendor`, `sw_type`. Nếu là `BUSINESS`, bỏ qua.

### 3.2. Tầng Frontend (Client-side Logic)
- **Dynamic Contextual Forms:** Refactor trang tạo App. Nếu người dùng tick chọn "Là phần mềm hệ thống", Form tự động hiển thị mở rộng (expand) thêm các trường nhập Vendor, EOL và Loại Middleware. Nếu bỏ tick, form ẩn các trường này đi (Dynamic rendering).
- **Tabbed Catalog View:** Tách danh sách Ứng dụng thành 2 tab UI riêng biệt. Gọi chung 1 API nhưng truyền param `type=BUSINESS` hoặc `type=SYSTEM`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/applications` | `GET` | Thêm param `?type=SYSTEM` hoặc `BUSINESS` | `VIEWER` |

### 4.2. Frontend Services / Hooks

| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useGetApplicationsQuery({ type })` | `GET /api/v1/applications` | Sử dụng type param để chia danh sách 2 tab. |*(Cập nhật lại các param truy vấn cho endpoint `/applications`)*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Mismatch Group Type (Lỗi 400):** Tạo app BUSINESS nhưng lại nhét vào một Group INFRASTRUCTURE -> Ném lỗi `BadRequestException`.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi tạo Migration script gộp data, cần cẩn thận bắt lỗi Duplicate Code vì có thể 1 app SYSTEM cũ có mã trùng với mã của app BUSINESS. Cần đánh suffix thủ công nếu có xung đột (VD: thêm đuôi `-sys`).

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Schema refactor, Data migration, Dynamic UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
