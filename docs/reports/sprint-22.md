# Sprint 22 — Trung tâm Trợ giúp & Knowledge Base

**Ngày bắt đầu:** 2026-05-22  
**Ngày kết thúc:** 2026-05-23  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống tài liệu hướng dẫn sử dụng (Help Center) tích hợp trực tiếp trong ứng dụng.

## 2. Kiến trúc Nội dung (Content Architecture)

- **Format:** Markdown rendering.
- **Search:** Tìm kiếm toàn văn (Full-text search) trong nội dung hướng dẫn.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Frontend (Help UI Logic)
- **Context-aware Help:** Tại mỗi trang chức năng, hệ thống cung cấp một nút "?" dẫn trực tiếp đến tài liệu hướng dẫn tương ứng của trang đó (Sử dụng `helpKey` prop).
- **Markdown Renderer:** Sử dụng thư viện `react-markdown` để hiển thị nội dung từ backend một cách sinh động (hỗ trợ Code block, Table, Bold).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/guides` | `GET` | Lấy nội dung hướng dẫn | `@Public()` |

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Guide Schema, Markdown renderer UI, Context help logic)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
