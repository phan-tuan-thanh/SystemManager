# Sprint 13 — Chế độ Dark Mode & UI/UX Tinh chỉnh

**Ngày bắt đầu:** 2026-05-09  
**Ngày kết thúc:** 2026-05-11  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tích hợp chế độ giao diện Tối (Dark Mode) chuẩn AntD V5 và tinh chỉnh trải nghiệm người dùng, đảm bảo tính responsive trên nhiều kích thước màn hình.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: UI Preferences (Local Storage State)**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `theme` | `String` | Chế độ sáng/tối | `light`, `dark` (Mặc định: `light`) |
| `menu_collapsed` | `Boolean` | Trạng thái thu gọn menu dọc | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
*(Không có thay đổi logic backend trong Sprint này)*

### 3.2. Tầng Frontend (Client-side Logic)
- **Theme Provider Injection:** Bọc toàn bộ root app bằng thẻ `ConfigProvider` của Ant Design. Hook trạng thái theme được kết nối vào thuộc tính `algorithm` (sử dụng `theme.defaultAlgorithm` hoặc `theme.darkAlgorithm`).
- **Hydration Sync:** Để tránh hiệu ứng giật màn hình (FOUC), trạng thái theme được lưu vào LocalStorage và đọc lên đồng bộ (Sync) ngay lúc khởi tạo React Tree.
- **CSS Token Overrides:** Đè (Override) lại một số biến CSS tĩnh (Glassmorphism, Gradient) bằng cú pháp `useToken` của AntD để tương thích hoàn toàn với nền tối.
- **Responsive Sider:** Tích hợp breakpoint của AntD. Nếu màn hình < 1200px (Laptop nhỏ), tự động collapse menu dọc thành icon thu gọn.

## 4. Đặc tả API Interfaces

*(Không áp dụng)*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Chart Colors Overflow:** Một số biểu đồ Recharts có mã màu cứng (Hardcode) dẫn đến không nhìn thấy trên nền Dark Mode. Cần sử dụng hàm parse màu từ AntD `useToken().colorText` để fill màu linh hoạt.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Tránh việc hardcode mã màu HEX trực tiếp vào các file CSS custom. Phải ưu tiên dùng CSS Variable sinh ra từ AntD Token (VD: `var(--ant-color-primary)`).

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Dark mode logic, AntD token setup, Responsive polish)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
