# Sprint 13 — Tối ưu UI/UX & Dark Mode

**Ngày bắt đầu:** 2026-05-01  
**Ngày kết thúc:** 2026-05-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Nâng cấp trải nghiệm người dùng thông qua việc tối ưu hoá giao diện, hỗ trợ Chế độ tối (Dark Mode) và cải thiện tính responsive trên các thiết bị.

## 2. Kiến trúc Theme (Design System)

- **Framework:** Ant Design v5 Design Token.
- **Algorithm:** `theme.defaultAlgorithm` và `theme.darkAlgorithm`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (User Preference)
- **Theme Persistence:** Lưu trữ lựa chọn giao diện (`light`/`dark`) vào bảng `UserPreference` để đồng bộ hoá trải nghiệm khi user đăng nhập trên các trình duyệt khác nhau.

### 3.2. Tầng Frontend (Dynamic Theme Logic)
- **Design Token Integration:** Toàn bộ CSS trong app được chuyển đổi sang sử dụng CSS Variables lấy từ Design Tokens của AntD. Điều này cho phép thay đổi màu sắc toàn app chỉ bằng cách cập nhật `ConfigProvider`.
- **Animation & Micro-interactions:** Bổ sung các hiệu ứng chuyển cảnh mượt mà khi mở Drawer/Modal và hiệu ứng Skeleton loading khi đang tải dữ liệu.
- **Responsive Layout:** Sử dụng hệ thống Grid (`Row/Col`) của AntD với các breakpoint chuẩn (`xs`, `sm`, `md`, `lg`, `xl`) để đảm bảo sidebar và nội dung tự động co giãn.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/users/preference` | `PATCH` | Cập nhật theme/ngôn ngữ | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Flicker Prevention:** Sử dụng `localStorage` để đọc theme ngay từ khi khởi tạo app, tránh hiện tượng màn hình bị nháy trắng trước khi áp dụng theme tối.

## 6. Hướng dẫn Bảo trì & Debug

- **Token Debug:** Có thể dùng tool `antd-token-previewer` để kiểm tra các biến màu sắc khi tuỳ chỉnh theme.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Dark mode logic, Design token integration, Responsive optimization)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
