# Sprint 10 — Dashboard Tổng quan & Báo cáo Audit

**Ngày bắt đầu:** 2026-04-30  
**Ngày kết thúc:** 2026-05-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Cung cấp cái nhìn tổng quát về sức khỏe hệ thống thông qua Dashboard và triển khai cơ chế xuất báo cáo Audit Log hàng loạt.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Audit Log Export DTO**
| Field | Type | Description |
|---|---|---|
| `from_date` | `DateTime` | Ngày bắt đầu lọc |
| `to_date` | `DateTime` | Ngày kết thúc lọc |
| `action` | `Enum` | Hành động cụ thể (`CREATE`, `DELETE`, ...) |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Aggregation & Streaming)
- **Status Aggregation:** API Dashboard thực hiện đếm (Count) số lượng tài nguyên theo môi trường và trạng thái (VD: bao nhiêu Server PROD đang Active, bao nhiêu Deployment đang Stopped).
- **Audit CSV Streaming:** Khi xuất log ra CSV, thay vì load toàn bộ dữ liệu vào bộ nhớ, Backend sử dụng cơ chế **Stream** (kết hợp `csv-stringify`) để đẩy dữ liệu trực tiếp về client theo từng dòng, giúp xử lý được các file log hàng triệu dòng mà không gây sập server.

### 3.2. Tầng Frontend (Analytics UI)
- **Statistic Cards:** Sử dụng các thẻ số liệu lớn (Statistic) với màu sắc cảnh báo: Xanh (Bình thường), Cam (Cảnh báo), Đỏ (Sự cố).
- **Recent Changes List:** Hiển thị 10 thao tác thay đổi cấu hình gần nhất giúp Admin nắm bắt nhanh các biến động trong ngày.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/audit-logs/export` | `GET` | Xuất file CSV (Streaming) | `ADMIN` |
| `/system/status` | `GET` | Thống kê Dashboard | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Aggregation logic, Streaming export, Dashboard UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
