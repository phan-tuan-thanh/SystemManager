# Sprint 12 — Tìm kiếm Toàn cục & Performance Polish

**Ngày bắt đầu:** 2026-05-06  
**Ngày kết thúc:** 2026-05-08  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai thanh tìm kiếm thông minh (Omnibar) cho phép tìm nhanh Server, Ứng dụng, IP và Domain trên toàn bộ hệ thống.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Search Result DTO**
| Field | Type | Description |
|---|---|---|
| `type` | `String` | Loại tài nguyên (`SERVER`, `APP`, `IP`) |
| `title` | `String` | Tên hiển thị kết quả |
| `subtitle` | `String` | Thông tin bổ sung (VD: hostname) |
| `url` | `String` | Link dẫn đến trang chi tiết |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Parallel Search Engine)
- **Parallel Querying:** Thay vì tìm tuần tự, Backend sử dụng `Promise.all` để kích hoạt tìm kiếm đồng thời trên 4 bảng dữ liệu: `Server`, `Application`, `NetworkConfig`, `ApplicationGroup`.
- **Rank Scoring:** Các kết quả khớp mã (Code) hoặc Hostname chính xác sẽ được đẩy lên đầu danh sách (Scoring logic).

### 3.2. Tầng Frontend (Omnibar UI)
- **Debounced Search:** Chỉ kích hoạt API khi người dùng ngừng gõ quá 300ms để giảm tải cho server.
- **Keyboard Navigation:** Hỗ trợ phím mũi tên và `Enter` để chọn nhanh kết quả tìm kiếm ngay trên thanh công cụ.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/search/global` | `GET` | Tìm kiếm đa mục tiêu | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Parallel Search, Rank logic, Debounced UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
