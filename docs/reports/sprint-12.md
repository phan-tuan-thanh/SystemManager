# Sprint 12 — Bộ lọc Tìm kiếm Toàn cục (Global Search)

**Ngày bắt đầu:** 2026-04-29  
**Ngày kết thúc:** 2026-04-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ tìm kiếm tập trung (Global Search) cho phép truy tìm nhanh Server, Ứng dụng hoặc IP từ bất kỳ màn hình nào.

## 2. Kiến trúc Tìm kiếm (Search Architecture)

- **Multi-table Search:** Thực hiện truy vấn trên nhiều bảng (`Server`, `Application`, `NetworkConfig`).
- **Pattern Matching:** Sử dụng toán tử `ILIKE` trong SQL để tìm kiếm không phân biệt hoa thường.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Parallel Search Logic)
- **Parallel Execution:** Backend khởi chạy 3-4 câu lệnh truy vấn Prisma đồng thời thông qua `Promise.all`.
- **Result Flattening:** Kết quả từ nhiều bảng được "làm phẳng" và chuẩn hoá về một định dạng chung gồm: `title`, `subtitle`, `type`, và `route_link`.
- **Highlighting Logic:** Tự động ưu tiên các kết quả khớp chính xác Mã (Code) hoặc IP lên đầu danh sách.

### 3.2. Tầng Frontend (Search UI Logic)
- **Header Search Box:** Một ô nhập liệu tích hợp tại Header. Sử dụng cơ chế `Debounce (300ms)` để tránh gửi quá nhiều request khi người dùng đang gõ.
- **Quick Results Popover:** Hiển thị kết quả dưới dạng danh sách thả xuống với các Icon phân loại (Server - Cloud icon, App - Box icon).
- **Keyboard Navigation:** Hỗ trợ phím mũi tên và phím `Enter` để chọn nhanh kết quả tìm kiếm mà không cần dùng chuột.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/system/search` | `GET` | Tìm kiếm toàn cục (`?q=keyword`) | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Empty State:** Khi không có kết quả, hiển thị thông báo "Không tìm thấy dữ liệu phù hợp" kèm gợi ý thử lại với từ khoá khác.

## 6. Hướng dẫn Bảo trì & Debug

- **Indexing:** Để đảm bảo tốc độ tìm kiếm khi dữ liệu lớn, cần đánh Index cho các cột `ip`, `code`, `name` trong DB.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 5 (Search Service, Multi-table query, Debounce search UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
