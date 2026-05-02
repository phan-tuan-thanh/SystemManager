# Sprint 04 — Quản lý Hạ tầng Phần cứng (Hardware Inventory)

**Ngày bắt đầu:** 2026-04-13  
**Ngày kết thúc:** 2026-04-14  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng kho quản lý linh kiện phần cứng (Hardware Inventory) chi tiết. Hỗ trợ theo dõi cấu hình máy chủ vật lý và ảo thông qua các thông số kỹ thuật (Specs) linh hoạt.

## 2. Kiến trúc Dữ liệu & Resource (Architecture)

- **Model `HardwareComponent`:** Lưu trữ CPU, RAM, HDD/SSD, Network Card.
- **JSON Specs:** Sử dụng kiểu dữ liệu JSON trong PostgreSQL để lưu trữ các thông số đặc thù cho từng loại linh kiện mà không cần sửa schema.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Inventory Logic)
- **Cơ chế Record History:** Mọi hành động Thêm/Sửa/Xoá phần cứng đều được `ChangeHistoryService` ghi lại một snapshot dữ liệu (Before/After).
- **Thu hồi (Detach):** Khi linh kiện bị tháo khỏi server, hệ thống thực hiện Soft Delete bản ghi, lưu vết ngày thu hồi để quản lý tồn kho ảo.

### 3.2. Tầng Frontend (Hardware Management UI)
- **KV Pair Editor:** Giao diện chỉnh sửa thông số kỹ thuật (Specs) được thiết kế dạng danh sách Key-Value linh hoạt sử dụng `Form.List`.
- **Hệ thống Gợi ý (Spec Presets):** Dựa vào loại linh kiện người dùng chọn (VD: CPU), UI tự động hiển thị các Tag gợi ý (`cores`, `threads`, `speed_ghz`). Khi nhấn vào Tag, trường dữ liệu tương ứng sẽ tự động được thêm vào form.
- **Hiển thị thông minh:** Component `HardwareTab` tự động bóc tách các field phổ biến (`gb`, `cores`) từ JSON để hiển thị ra cột "Thông số" trên bảng một cách thân thiện thay vì hiển thị code JSON thô.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/hardware` | `POST` | Thêm linh kiện mới vào Server | `OPERATOR` |
| `/hardware/:id/detach`| `DELETE` | Thu hồi linh kiện khỏi Server | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Missing ID:** Chặn các request cập nhật nếu linh kiện không còn tồn tại trên server đã định danh.
- **Validation:** Frontend kiểm tra tính hợp lệ của các cặp Key-Value (không cho phép Key trống) trước khi gửi lên Backend.

## 6. Hướng dẫn Bảo trì & Debug

- **JSON Data:** Nếu muốn thêm loại linh kiện mới, chỉ cần cập nhật mảng `HARDWARE_TYPES` và `SPEC_PRESETS` trên Frontend.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 7 (Hardware Schema, JSON Specs support, Detach logic, KV Editor UI, Spec suggestions)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
