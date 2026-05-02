# Sprint 10 — Dashboard Tổng quan & Báo cáo Audit

**Ngày bắt đầu:** 2026-04-30  
**Ngày kết thúc:** 2026-05-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng giao diện Dashboard cung cấp cái nhìn tổng quát về sức khỏe hệ thống, kết hợp tính năng truy xuất và tải xuống dữ liệu Audit Log dung lượng lớn.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: Audit Log Export DTO**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `from_date` | `DateTime` | Ngày bắt đầu lọc | `Optional` |
| `to_date` | `DateTime` | Ngày kết thúc lọc | `Optional` |
| `action` | `Enum` | Thao tác (`CREATE`, `DELETE`, ...) | `Optional` |

#### **Hằng số & Enums (Constants & Options)**
- `DashboardStatus`: Trạng thái tổng quát (`HEALTHY`, `WARNING`, `CRITICAL`).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Aggregation Query:** API Dashboard thực hiện đếm (Count) số lượng tài nguyên gom nhóm theo trạng thái (VD: đếm số Server đang `ACTIVE` vs `MAINTENANCE`). Tối ưu query bằng cách dùng `GROUP BY` trong Prisma.
- **CSV Streaming Logic:** Khi Admin xuất log (hàng triệu dòng), thay vì load mảng khổng lồ vào RAM gây tràn bộ nhớ, Backend sử dụng cơ chế `StreamableFile` của NestJS kết hợp thư viện `csv-stringify`. Dữ liệu được đọc từ DB bằng cursor và pipe (đẩy) trực tiếp qua HTTP response xuống trình duyệt client.

### 3.2. Tầng Frontend (Client-side Logic)
- **Statistic Cards UI:** Render số liệu hệ thống lên các thẻ thống kê (`Card`) kèm biểu đồ Mini (Sparkline). Sử dụng thư viện `Recharts` cho biểu đồ nhẹ nhàng.
- **Polling / Refresh:** Sử dụng tính năng `refetchInterval` của TanStack Query để Dashboard tự động làm mới số liệu mỗi 60 giây.
- **Blob File Download:** Khi tải CSV, Frontend bắt tín hiệu `blob` từ Axios, tự động tạo URL ảo qua `URL.createObjectURL` và kích hoạt sự kiện click thẻ `<a>` ẩn để lưu file.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/system/status` | `GET` | Truy vấn thống kê Dashboard | `VIEWER` |
| `/api/v1/audit-logs/export` | `GET` | Export Audit Log ra CSV stream | `ADMIN`, `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Date Range Error (Lỗi 400):** `to_date` truyền vào nhỏ hơn `from_date` -> DTO validator ném lỗi 400.
- **Stream Interrupt:** Nếu client ngắt kết nối (đóng tab) khi đang tải file dở dang, event `close` được kích hoạt trên stream để Backend dọn dẹp cursor DB, tránh memory leak.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Do Audit Log có thể phình to rất nhanh, không nên tạo Index trên các trường text dài (như `message`) mà chỉ Index trên các trường phân tích chính (như `action`, `created_at`).

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Aggregation logic, Streaming export, Dashboard UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
