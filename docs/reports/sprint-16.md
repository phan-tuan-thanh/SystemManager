# Sprint 16 — Phân tách Nhóm Hạ tầng & Nghiệp vụ

**Ngày bắt đầu:** 2026-05-08  
**Ngày kết thúc:** 2026-05-09  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Chuẩn hoá việc phân loại nhóm ứng dụng thành hai luồng chính: Hạ tầng (Infrastructure) và Nghiệp vụ (Business). Giúp tách biệt quản lý phần mềm hệ thống và phần mềm nghiệp vụ.

## 2. Kiến trúc Phân loại (Classification)

- **Group Type:** `INFRASTRUCTURE` vs `BUSINESS`.
- **Phân tách UI:** Hai trang quản lý riêng biệt cho Phần mềm hạ tầng và Ứng dụng nghiệp vụ.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Grouping Logic)
- **Aggregated Counting:** API danh sách nhóm trả về kèm theo số lượng server và deployment tương ứng trong từng nhóm (sử dụng `_count` của Prisma).
- **Type Restriction:** Ràng buộc chặt chẽ tại tầng Service: Không cho phép di chuyển một ứng dụng `SYSTEM` vào nhóm `BUSINESS`.

### 3.2. Tầng Frontend (View Separation)
- **Sidebar Navigation:** Tách thành 2 mục menu: "Hạ tầng" (chứa Hệ thống, Servers, Networks) và "Ứng dụng" (chứa Ứng dụng nghiệp vụ, Deployments).
- **Filtered List:** Trang danh sách Ứng dụng sử dụng tham số query `?type=BUSINESS` hoặc `?type=SYSTEM` để hiển thị dữ liệu phù hợp với ngữ cảnh người dùng đang xem.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/app-groups?type=INFRA` | `GET` | Lấy nhóm hạ tầng | `VIEWER` |
| `/app-groups?type=BUSINESS`| `GET` | Lấy nhóm nghiệp vụ | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Access Denied:** Nếu user chỉ có quyền trên một số nhóm nhất định, backend thực hiện lọc dữ liệu (Data Filtering) ngay từ câu truy vấn SQL.

## 6. Hướng dẫn Bảo trì & Debug

- **System Softwares:** Các phần mềm như DB, WebServer, OS luôn được xếp vào nhóm Hạ tầng.

---

## 7. Metrics & Tasks

- Story Points: 10
- Tasks: 4 (Group type extension, Counting logic, UI separation)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
