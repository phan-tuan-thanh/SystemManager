# Sprint 10 — Dashboard Tổng hợp & Xuất dữ liệu Audit Log

**Ngày bắt đầu:** 2026-04-25  
**Ngày kết thúc:** 2026-04-26  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng trung tâm điều hành (Dashboard) trực quan hoá toàn bộ tài nguyên hệ thống và cung cấp công cụ xuất dữ liệu Audit Log phục vụ việc hậu kiểm (Audit).

## 2. Kiến trúc & Logic Tổng hợp (Architecture)

- **Aggregation Logic:** Sử dụng các truy vấn `groupBy` và `count` của Prisma để tổng hợp dữ liệu theo môi trường và trạng thái triển khai.
- **Audit Storage:** Bảng `AuditLog` lưu trữ snapshot dưới dạng JSONB để tối ưu hiệu suất truy vấn lịch sử.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Aggregation & Export Logic)
- **Streaming CSV Export:** Để tránh tràn bộ nhớ (OOM) khi xuất hàng trăm ngàn dòng log, backend sử dụng cơ chế `batch fetching`. Dữ liệu được đọc từng cụm 500 dòng, chuyển đổi sang CSV và stream trực tiếp về client qua HTTP response.
- **Parallel Status Check:** API `/system/status` thực hiện nhiều truy vấn đếm song song (`Promise.all`) để giảm thời gian phản hồi của Dashboard.

### 3.2. Tầng Frontend (Reporting UI)
- **Dynamic Charts:** Sử dụng component `Progress` và `Statistic` để biểu diễn tỉ lệ phân bổ server theo môi trường (DEV/UAT/PROD). Màu sắc được đồng bộ hoá toàn hệ thống.
- **Real-time Polling:** Dashboard được thiết lập `staleTime: 30s`, tự động làm mới dữ liệu ngầm để đảm bảo số lượng tài nguyên hiển thị luôn cập nhật.
- **Recent Changes List:** Hiển thị 8 thay đổi gần nhất từ Audit Log, bóc tách thông tin `resource_name` từ JSON snapshot để hiển thị nhãn thân thiện cho người dùng.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/audit-logs/export` | `GET` | Xuất CSV (Streaming) | `ADMIN` |
| `/system/status` | `GET` | Lấy số liệu Dashboard | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Timeout:** Các truy vấn aggregation lớn được đặt timeout để tránh làm treo database.
- **Export Failure:** Nếu quá trình stream file bị ngắt quãng, backend sẽ đóng connection và ghi log lỗi để admin xử lý.

## 6. Hướng dẫn Bảo trì & Debug

- **Audit Purge:** Cần lập lịch dọn dẹp các bản ghi audit log cũ hơn 1 năm để giải phóng dung lượng DB.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Audit Schema, CSV Export logic, Aggregation API, Dashboard UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
