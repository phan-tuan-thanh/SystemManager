# Sprint 22 — Trung tâm Trợ giúp & Knowledge Base

**Ngày bắt đầu:** 2026-05-22  
**Ngày kết thúc:** 2026-05-23  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống tài liệu hướng dẫn và cơ chế hỗ trợ người dùng theo ngữ cảnh (Context Help).

## 2. Đặc tả dữ liệu (Data Structures)

#### **Guide Metadata**
| Field | Type | Description |
|---|---|---|
| `key` | `String` | Định danh trang (VD: 'firewall-rule') |
| `title` | `String` | Tiêu đề bài hướng dẫn |
| `content` | `String` | Nội dung định dạng Markdown |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Frontend (Context-aware Logic)
- **Help Button Injection:** Component `PageHeader` tự động kiểm tra `helpKey` được truyền vào. Nếu có, nó sẽ hiển thị một nút "?" liên kết tới bài hướng dẫn tương ứng trong Knowledge Base.
- **Markdown Rendering:** Tích hợp bộ giải mã Markdown hỗ trợ hiển thị bảng, mã nguồn và hình ảnh minh họa sinh động.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Guide data, Markdown UI, Context button logic)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
