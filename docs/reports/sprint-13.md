# Sprint 13 — UI/UX Polish & Dynamic Theme (Dark Mode)

**Ngày bắt đầu:** 2026-05-01  
**Ngày kết thúc:** 2026-05-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tối ưu hóa trải nghiệm người dùng cuối (UX) thông qua việc đồng bộ hóa giao diện (Dark Mode) và làm sạch luồng điều hướng. Đảm bảo hệ thống đạt chuẩn thẩm mỹ PROD với Ant Design v5.

## 2. Kiến trúc & Logic Theme (Frontend Architecture)

- **Ant Design v5 Design Token:** Tận dụng cơ chế `ConfigProvider` của AntD để thay đổi bộ màu sắc động mà không cần reload trang.
- **State Management:** Lưu trạng thái `isDarkMode` vào `Zustand Store` (hoặc Redux) và đồng bộ với `localStorage`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Chuyển đổi Theme động
- **Logic:** Khi người dùng click chuyển chế độ:
  - Cập nhật biến trạng thái trong global store.
  - `ConfigProvider` nhận prop `theme` mới (sử dụng `theme.darkAlgorithm` hoặc `theme.defaultAlgorithm`).
  - Toàn bộ các component (Button, Table, Card) tự động tính toán lại màu sắc dựa trên Design Tokens.

### 3.2. Cấu hình Màu sắc Thương hiệu
- Định nghĩa bộ màu Primary (`#1677ff`) và các màu trạng thái (Success, Warning, Error) đồng nhất cho cả hai chế độ Light/Dark.
- Tùy chỉnh `borderRadius` và `boxShadow` để tạo cảm giác hiện đại, chuyên nghiệp.

## 4. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Flash of Unstyled Content (FOUC):** Đảm bảo script đọc `localStorage` và gán class theme được chạy ngay từ thẻ `<head>` để tránh tình trạng giao diện bị nháy màu khi load trang.

## 5. Hướng dẫn Bảo trì & Debug

- **Custom Component:** Khi viết component thủ công (không dùng AntD), hãy sử dụng CSS Variables do AntD cung cấp hoặc hook `useToken()` để lấy mã màu theme hiện tại.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Theme Context setup, AntD v5 Token mapping, Dark mode toggle, Persistence logic)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
