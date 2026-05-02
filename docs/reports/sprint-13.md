# Sprint 13 — Chế độ Dark Mode & Trải nghiệm Người dùng

**Ngày bắt đầu:** 2026-05-09  
**Ngày kết thúc:** 2026-05-11  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Nâng cấp giao diện người dùng chuyên nghiệp với chế độ Tối (Dark Mode) và tinh chỉnh các thành phần điều hướng.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **User Preferences (UI State)**
| Key | Type | Description |
|---|---|---|
| `theme` | `String` | `light` hoặc `dark` |
| `collapsed` | `Boolean` | Trạng thái thu gọn menu |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Frontend (Theme Integration)
- **Ant Design Design Tokens:** Sử dụng `ConfigProvider` của AntD để thay đổi màu sắc chủ đạo của toàn bộ ứng dụng dựa trên thuật toán `darkAlgorithm`.
- **Theme Persistence:** Trạng thái giao diện được lưu vào `localStorage` và đồng bộ ngay khi trang web được tải lại (`Hydration logic`).
- **Responsive Layout:** Tự động thu gọn Menu bên trái (Sider) khi độ phân giải màn hình nhỏ hơn 1200px (Mobile-friendly base).

## 4. Giao diện (UI Components)
- **Theme Switcher:** Một nút chuyển đổi (Toggle) nằm tại Header với icon Mặt trời/Mặt trăng.
- **Glassmorphism Header:** Header sử dụng hiệu ứng làm mờ nền (Blur) khi cuộn trang, tạo cảm giác cao cấp.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Dark mode logic, AntD token setup, Responsive polish)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
