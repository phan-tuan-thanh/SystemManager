# Add Demo UI — UI Design & Mockup Pipeline

Thiết kế hoặc cập nhật các giao diện người dùng (UI mockups) liên quan đến Sprint đang thực hiện. Các thiết kế này giúp định hướng triển khai frontend và thống nhất trải nghiệm người dùng trước khi code.

## Input
- UI Description: $ARGUMENTS (e.g., "giao diện trang Upload Server với bảng preview và các trường thông số kỹ thuật")

---

## Phase 1 — Phân tích Giao diện

1. Đọc `docs/SRS.md` và `docs/plans/implementation_plan.md` để hiểu luồng nghiệp vụ và các trường dữ liệu cần hiển thị.
2. Xác định các thành phần UI (Ant Design components) sẽ sử dụng: `Table`, `Form`, `Descriptions`, `Modal`, `Upload`, v.v.
3. Xác định phong cách thiết kế: Dark mode / Light mode, Enterprise style, gọn gàng, tập trung vào dữ liệu.

---

## Phase 2 — Thiết kế & Phát triển Demo HTML Tương tác

### 2.1 Phát triển file HTML "Sống"
- Tạo một file HTML (`.html`) độc lập trong thư mục `docs/plans/demo-ui/`.
- **Quy tắc kỹ thuật:**
    - Sử dụng **React & Ant Design (CDN)** để xây dựng giao diện. Điều này giúp code demo gần nhất với code thực tế.
    - **Inline Data Store**: Khai báo một object `const DEMO_DATA = { ... }` ở đầu tag script chứa toàn bộ dữ liệu mẫu (JSON format).
    - **Xử lý Logic**: Implement các hàm xử lý sự kiện (onClick, onChange, onSearch) để thay đổi UI state.

### 2.2 Các tính năng tương tác bắt buộc
- **Workflow Simulation**: Người dùng phải có thể đi qua một luồng nghiệp vụ (ví dụ: Upload -> Preview -> Success Notification).
- **Dynamic Filtering/Search**: Bảng dữ liệu mẫu phải có khả năng lọc hoặc tìm kiếm cơ bản ngay trên UI demo.
- **Form Validation**: Mô phỏng việc kiểm tra lỗi khi người dùng điền vào các form giả lập.
- **Feedback UI**: Hiển thị các thông báo (Message, Notification, Modal) khi tương tác để tăng tính trải nghiệm.

---

## Phase 3 — Lưu trữ & Tài liệu

### 3.1 Cấu trúc thư mục
- Đặt tên file: `sprint-<NN>-<ui-name>.html`.
- Toàn bộ CSS/JS/Data phải được nhúng **inline** trong 1 file duy nhất nếu có thể để dễ dàng chia sẻ và mở mà không cần server.

### 3.2 Mô tả & Hướng dẫn
Cập nhật file Markdown `docs/plans/demo-ui/sprint-<NN>-<ui-name>.md` để dẫn link tới file HTML:
```markdown
# UI Demo: <Tên Giao diện> (Sprint <NN>)

[👉 Mở Bản Demo Tương tác](<path_to_html_file>)

## Kịch bản tương tác (Demo Script)
1. **Hành động 1**: <Kết quả mong đợi>
2. **Hành động 2**: <Kết quả mong đợi>

## Cấu trúc Dữ liệu Mẫu (JSON)
- Mô tả các trường dữ liệu chính được sử dụng trong `DEMO_DATA`.

## Ghi chú triển khai cho Developer
- **State**: Mô tả cách quản lý state trong demo để dev áp dụng vào Zustand/React Query.
- **Components**: Danh sách Ant Design components và props quan trọng.
```

### 3.3 Cập nhật Implementation Plan
- Chèn link tới bản Demo HTML vào `docs/plans/implementation_plan.md` để team dev có thể mở lên xem và "copy" cấu trúc HTML/CSS nếu cần.

---

## Phase 4 — Kiểm tra & Handoff

- [ ] Đảm bảo các chức năng tương tác (Tab, Upload simulation, Filter) hoạt động mượt mà.
- [ ] Đảm bảo các trường dữ liệu trên mockup khớp với Schema/DTO.
- [ ] Thông báo cho user về các thay đổi giao diện và xin ý kiến phản hồi.
