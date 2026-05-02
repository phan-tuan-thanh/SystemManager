# Sprint 22 — Trung tâm Trợ giúp & Knowledge Base

**Ngày bắt đầu:** 2026-05-22  
**Ngày kết thúc:** 2026-05-23  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tích hợp hệ thống tài liệu hướng dẫn nội bộ (Knowledge Base) hiển thị theo ngữ cảnh trang web, giúp Admin có sẵn sổ tay ngay khi thao tác.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Hướng dẫn viên (Guide Metadata)**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `key` | `String` | Định danh trang khớp với URL | (VD: 'firewall-rule-page') |
| `content` | `String` | Nội dung văn bản | Định dạng chuẩn Markdown |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
*(Chủ yếu phục vụ lấy data tĩnh từ bảng KnowledgeBase, không có logic phức tạp)*

### 3.2. Tầng Frontend (Client-side Logic)
- **Context-aware Help Button:** Bổ sung property `helpKey` vào component `PageLayout`. Hàm `useEffect` sẽ tự check xem `helpKey` truyền vào có tồn tại bài viết hướng dẫn tương ứng trên API không. Nếu có, nó render Icon hỏi đáp "?" ở góc phải Navbar. Bấm vào sẽ mở modal hiển thị hướng dẫn.
- **Markdown Render Engine:** Tích hợp thư viện `react-markdown` kết hợp `remark-gfm` để dịch các bảng, checkbox, list và đoạn code snippets thành UI thân thiện.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/guides/:key` | `GET` | Tải nội dung bài viết hướng dẫn | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Missing Guide (Lỗi 404):** Nút Help tự động ẩn đi nếu gọi API lấy guide thất bại (Tránh UI hiển thị modal rỗng).

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi viết hướng dẫn, nếu sử dụng thẻ HTML thô trong nội dung Markdown, thư viện Frontend có thể filter/escape bỏ đi nhằm chống tấn công XSS. Cần chú ý định dạng.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Guide data, Markdown UI, Context button logic)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
