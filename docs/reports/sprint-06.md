# Sprint 06 — Danh mục Ứng dụng & Nhóm Nghiệp vụ

**Ngày bắt đầu:** 2026-04-17  
**Ngày kết thúc:** 2026-04-18  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng thư viện quản lý toàn bộ các ứng dụng (Application Catalog) trong hệ thống. Phân loại ứng dụng theo nhóm nghiệp vụ (AppGroup) và quản lý phiên bản phần mềm nhất quán.

## 2. Kiến trúc Catalog (Catalog Architecture)

- **Model `ApplicationGroup`:** Phân nhóm theo nghiệp vụ hoặc hạ tầng (VD: Core Banking, Middleware).
- **Model `Application`:** Thông tin chi tiết về từng ứng dụng, team sở hữu (`owner_team`) và loại ứng dụng (`BUSINESS`, `SYSTEM`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Catalog Logic)
- **Ràng buộc Loại ứng dụng (AppType Validation):** Khi tạo ứng dụng, hệ thống kiểm tra logic chéo giữa Nhóm ứng dụng và Loại ứng dụng để đảm bảo tính nhất quán (VD: Nhóm "Hạ tầng" chỉ chứa các ứng dụng loại "SYSTEM").
- **Mã ứng dụng (Unique Code):** Tự động chuẩn hoá Code ứng dụng (viết hoa, không dấu, thay khoảng trắng bằng gạch dưới) để phục vụ việc định danh duy nhất toàn hệ thống.

### 3.2. Tầng Frontend (Catalog UI)
- **Giao diện Phân cấp:** Hiển thị danh sách Ứng dụng theo dạng Table có khả năng lọc nhanh theo Nhóm ứng dụng (AppGroup).
- **Form Tạo mới thông minh:** Khi chọn Nhóm ứng dụng, UI tự động gợi ý loại ứng dụng phù hợp.
- **Thống kê:** Hiển thị số lượng ứng dụng đang chạy (Running) và dừng (Stopped) ngay trên Dashboard của từng Nhóm.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/app-groups` | `GET` | Lấy danh sách nhóm ứng dụng | `VIEWER` |
| `/applications` | `POST` | Đăng ký ứng dụng mới vào danh mục | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Duplicate Code:** Chặn việc tạo Ứng dụng có mã trùng với ứng dụng hiện có trong Catalog.
- **Dependency:** Cảnh báo khi xoá một Ứng dụng nếu ứng dụng đó đang có các bản triển khai (Deployments) hiện hữu.

## 6. Hướng dẫn Bảo trì & Debug

- **Data Cleanup:** Thường xuyên kiểm tra các ứng dụng không có Deployment để tối ưu danh mục.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Application Schema, Grouping logic, Code normalizer, Catalog UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
