# Sprint 13 — UI/UX Polish & Theme Management

**Ngày bắt đầu:** 2026-05-08  
**Ngày kết thúc:** 2026-05-09  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Hoàn thiện giao diện người dùng, triển khai Dark Mode và tối ưu hóa trải nghiệm Responsive.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **State Store: ThemeStore**
| Field | Type | Description | Values |
|---|---|---|---|
| `mode` | `String` | Chế độ hiển thị | `light`, `dark` |
| `collapsed` | `Boolean` | Trạng thái Sidebar | `true`, `false` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Frontend (Client-side Logic)
- **Dynamic Styling:** Sử dụng CSS Variables để thay đổi mã màu theo `ThemeStore`.
- **Persist State:** Lưu lựa chọn theme của người dùng vào `localStorage`.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
*(Không áp dụng cho Sprint UI)*

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useThemeStore()` | `Local Storage` | Quản lý trạng thái giao diện phía client. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **System Preference:** Tự động nhận diện theme của hệ điều hành nếu người dùng chưa chọn.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Đảm bảo tất cả các component mới đều sử dụng biến CSS thay vì mã màu cố định (hard-coded).

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Theme logic, Responsive design, Polish UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
