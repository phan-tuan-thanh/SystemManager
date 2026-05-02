# Sprint 12 — Tìm kiếm Toàn cầu (Global Search)

**Ngày bắt đầu:** 2026-05-06  
**Ngày kết thúc:** 2026-05-07  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng thanh tìm kiếm Omnibar hỗ trợ tìm kiếm nhanh Máy chủ, Ứng dụng và Cấu hình mạng trên toàn hệ thống.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **DTO: SearchResult**
| Field | Type | Description |
|---|---|---|
| `type` | `String` | Loại tài nguyên (`server`, `app`, `network`) |
| `id` | `String` | ID bản ghi |
| `title` | `String` | Tên bản ghi hiển thị |
| `subtitle` | `String` | Thông tin phụ (IP, Code) |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Multi-table Query:** Sử dụng `Prisma.$transaction` hoặc chạy `findMany` song song trên 3 bảng: `Server`, `Application`, `NetworkConfig`.
- **Fuzzy Search:** Sử dụng toán tử `contains` và `mode: 'insensitive'` của Prisma để tìm kiếm không phân biệt hoa thường.

### 3.2. Tầng Frontend (Client-side Logic)
- **Omnibar UI:** Giao diện Modal nổi (Hotkey `Cmd+K`) tích hợp AntD `AutoComplete`.
- **Debounce:** Chỉ gọi API sau khi người dùng ngừng gõ phím 300ms.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/system/search` | `GET` | Tìm kiếm đa bảng | `VIEWER` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useGlobalSearch(query)` | `GET /api/v1/system/search` | Hook thực thi tìm kiếm khi gõ Omnibar. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Search Limit:** Giới hạn trả về tối đa 10 kết quả cho mỗi loại tài nguyên để đảm bảo tốc độ phản hồi.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi bổ sung bảng dữ liệu mới vào search, cần ánh xạ dữ liệu trả về theo đúng format `SearchResult`.

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (Search Service, Multi-table query, Omnibar UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
