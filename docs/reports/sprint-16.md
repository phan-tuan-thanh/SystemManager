# Sprint 16 — App Group Restructure & Unified Catalog

**Ngày bắt đầu:** 2026-05-07  
**Ngày kết thúc:** 2026-05-08  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tái cấu trúc logic phân nhóm ứng dụng. Phân định rõ ràng ranh giới giữa Nhóm nghiệp vụ (Business Group) và Nhóm hạ tầng (Infrastructure Group) để áp dụng các chính sách quản lý khác nhau cho từng loại tài nguyên.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Cập nhật Model `ApplicationGroup`:**
  - Thêm trường `group_type`: Enum (`BUSINESS`, `INFRASTRUCTURE`).
  - Mỗi nhóm có thể cấu hình `default_role` cho các thành viên tham gia.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Phân tách Dữ liệu (Group Separation)
- **Business Groups:** Chứa các ứng dụng nghiệp vụ phục vụ người dùng cuối. Tập trung vào các thuộc tính như `owner_team`, `deployments`.
- **Infrastructure Groups:** Chứa các phần mềm hệ thống (OS, Middleware, DB Engine). Tập trung vào các thuộc tính `version`, `eol_date`.
- **Thực thi:** API `list` hỗ trợ lọc theo `group_type`, cho phép xây dựng các màn hình quản trị riêng biệt cho Team Hạ tầng và Team Ứng dụng.

### 3.2. Thống kê nhanh (Aggregated Count)
- Trong API danh sách, hệ thống sử dụng tính năng `_count` của Prisma để trả về số lượng ứng dụng đang thuộc về từng nhóm, giúp hiển thị các Badge thống kê trên UI Dashboard của Nhóm.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/app-groups` | `GET` | Danh sách nhóm (kèm count) | `VIEWER` |
| `/app-groups/:id` | `GET` | Chi tiết nhóm & Apps bên trong | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Safe Removal:** Chặn việc xoá một Nhóm ứng dụng nếu bên trong vẫn còn chứa các Ứng dụng hoặc Phần mềm hệ thống chưa được di dời hoặc xoá bỏ.

## 6. Hướng dẫn Bảo trì & Debug

- **Data Consistency:** Khi chuyển đổi một Ứng dụng từ Nhóm A sang Nhóm B, hệ thống sẽ kiểm tra tính tương thích của `group_type` để tránh sai lệch dữ liệu phân loại.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 5 (AppGroup Schema update, Group Type Logic, Aggregated Stats API)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
