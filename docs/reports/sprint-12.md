# Sprint 12 — Tìm kiếm Toàn cục (Global Search) & Tối ưu Performance

**Ngày bắt đầu:** 2026-05-06  
**Ngày kết thúc:** 2026-05-08  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cung cấp công cụ tìm kiếm đa mục tiêu (Omnibar Search) giúp người dùng tra cứu nhanh Server, App, IP trực tiếp từ bất kỳ đâu trên hệ thống.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Search Result DTO**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `type` | `String` | Loại tài nguyên | `SERVER`, `APP`, `IP`, `GROUP` |
| `title` | `String` | Tên hiển thị (Text in đậm) | |
| `subtitle` | `String` | Thông tin phụ (VD: Hostname) | |
| `url` | `String` | Link frontend đích | (VD: `/server/123`) |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Parallel Query Execution:** Backend tối ưu hiệu năng bằng cách không dùng chuỗi lệnh `await` tuần tự, mà gộp 4 lệnh tìm kiếm (trên 4 bảng Server, App, Network, Group) vào chung một mảng `Promise.all()`. Việc này giảm thời gian response xuống 1/4.
- **Relevance Ranking:** Xây dựng logic chấm điểm (Scoring). Kết quả khớp chính xác 100% với tên Server được đẩy lên đầu. Kết quả khớp IP nằm giữa, khớp mô tả rác (description) nằm cuối mảng trả về.

### 3.2. Tầng Frontend (Client-side Logic)
- **Debounced Search Bar:** Component thanh tìm kiếm bọc hook `useDebounce(value, 300ms)` để chỉ bắt đầu gọi API sau khi người dùng ngừng gõ phím 300 mili-giây, ngăn tình trạng DDOS hệ thống (Spam API).
- **Keyboard Navigation:** Omnibar hỗ trợ người dùng dùng phím mũi tên Lên/Xuống để duyệt danh sách và phím Enter để điều hướng, tương tự phong cách Spotlight của MacOS.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/search/global` | `GET` | Tìm kiếm đa bảng | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Search Term Too Short:** Nếu query truyền lên dưới 2 ký tự, API trả về ngay mảng rỗng (Tránh quét full text trên DB gây lag).

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi tìm kiếm text có dấu tiếng Việt, cần đảm bảo query trên Postgres đang sử dụng cấu hình collation hỗ trợ, nếu không kết quả tìm "may chu" sẽ không ra "máy chủ".

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Parallel Search, Rank logic, Debounced UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
