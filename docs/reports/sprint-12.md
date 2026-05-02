# Sprint 12 — Global Unified Search Engine

**Ngày bắt đầu:** 2026-04-29  
**Ngày kết thúc:** 2026-04-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ tìm kiếm hợp nhất (Global Search). Cho phép người dùng tìm nhanh bất kỳ tài nguyên nào (Server, Application, IP Address, Domain) chỉ từ một thanh nhập liệu duy nhất trên Header.

## 2. Kiến trúc & Schema Database (Architecture)

- **Search Pattern:** Sử dụng `ILIKE` (không phân biệt hoa thường) kết hợp với toán tử `OR` trên nhiều bảng khác nhau.
- **Dữ liệu trả về:** Một Object gộp nhóm theo loại tài nguyên (`servers`, `applications`, `networks`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Thuật toán Tìm kiếm Đa bảng
- **Logic (`globalSearch`):**
  - Chặn các từ khoá tìm kiếm ngắn hơn 2 ký tự để tối ưu hiệu năng.
  - Thực hiện 3 câu lệnh SQL song song:
    - **Server:** Tìm theo Name, Code, Hostname.
    - **Application:** Tìm theo Name, Code.
    - **Network:** Tìm theo Private IP, Public IP, Domain.
- **Normalize Dữ liệu:** Mỗi bản ghi trả về được đính kèm trường `label` (Chuỗi hiển thị) và `path` (Đường dẫn điều hướng) để Frontend có thể hiển thị trực tiếp trong danh sách gợi ý (Dropdown).

### 3.2. Debounce & UX
- **Frontend:** Tích hợp `TanStack Query` với cơ chế debounce (trễ 300ms) để tránh việc gửi request liên tục khi người dùng đang gõ phím.
- **Kết quả:** Hiển thị kết quả tìm kiếm ngay lập tức với icon phân loại cho từng tài nguyên.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Tham số | Chức năng | Quyền |
|---|---|---|---|---|
| `/system/search` | `GET` | `?q=keyword` | Tìm kiếm toàn cục | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Empty Result:** Trả về mảng rỗng thay vì lỗi nếu không tìm thấy dữ liệu.
- **Performance:** Giới hạn mỗi loại tài nguyên chỉ lấy tối đa 10 kết quả (`take: 10`) để đảm bảo tốc độ phản hồi < 100ms.

## 6. Hướng dẫn Bảo trì & Debug

- **Mở rộng:** Để thêm loại tài nguyên mới vào search (VD: Document), chỉ cần thêm một truy vấn `prisma.document.findMany` vào hàm `globalSearch`.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (Multi-table search logic, Data normalization, Frontend Header Search, Debouncing UX)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
