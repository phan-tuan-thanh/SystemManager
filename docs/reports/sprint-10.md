# Sprint 10 — Dashboard Stats & Audit Log CSV Export

**Ngày bắt đầu:** 2026-04-25  
**Ngày kết thúc:** 2026-04-26  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng trung tâm điều hành (Dashboard) cung cấp cái nhìn tổng thể về sức khoẻ hạ tầng và triển khai ứng dụng. Hoàn thiện tính năng Audit Log với khả năng trích xuất dữ liệu (Export CSV) phục vụ mục đích báo cáo và tuân thủ (Compliance).

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `AuditLog`:** Lưu vết mọi hành động nhạy cảm (Action, Resource, User, Result, IP).
- **Dashboard Logic:** Sử dụng `Prisma.groupBy` để tổng hợp dữ liệu thống kê theo môi trường và trạng thái mà không cần tải toàn bộ bản ghi về memory.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Thống kê Dashboard (Grouped Aggregation)
- **Cơ chế:** Backend thực hiện `Promise.all` song song các truy vấn đếm (`count`) và nhóm (`groupBy`).
- **Kết quả:** Trả về số lượng Server theo từng môi trường (`serversByEnv`) và số lượng Deployment theo trạng thái (`deploymentsByStatus`).
- **Frontend:** Sử dụng `Ant Design Charts` để trực quan hoá dữ liệu dưới dạng Pie Chart và Bar Chart.

### 3.2. Xuất dữ liệu Audit Log (Streaming CSV Export)
- **Vấn đề:** Bảng Audit Log có thể chứa hàng chục nghìn bản ghi, việc load tất cả vào mảng sẽ gây lỗi tràn bộ nhớ (Memory Leak).
- **Giải pháp:** 
  - Sử dụng luồng lặp (`while(true)`) với cơ chế `skip/take` (Batch size: 500).
  - Sử dụng `res.write()` để đẩy dữ liệu CSV xuống client theo từng đợt ngay khi vừa fetch xong.
  - Thiết lập header `Content-Type: text/csv` và `Content-Disposition` để trình duyệt nhận diện file tải về.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/system/status` | `GET` | Lấy số liệu thống kê Dashboard | `VIEWER` |
| `/audit/export` | `GET` | Stream CSV Audit Log | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **CSV Escape:** Các trường dữ liệu trong CSV được bọc trong dấu ngoặc kép `""` và escape các ký tự đặc biệt để đảm bảo file Excel mở được chính xác dù nội dung log có chứa dấu phẩy hoặc xuống dòng.

## 6. Hướng dẫn Bảo trì & Debug

- **Polling:** Dashboard trên Frontend được cấu hình tự động làm mới dữ liệu mỗi 60 giây (Configurable) để đảm bảo thông tin luôn cập nhật.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Dashboard API, GroupBy queries, Streaming CSV Export, AntD Charts integration)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
