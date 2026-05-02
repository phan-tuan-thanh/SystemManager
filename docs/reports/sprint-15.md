# Sprint 15 — Vòng đời Hệ điều hành (OS Lifecycle)

**Ngày bắt đầu:** 2026-05-06  
**Ngày kết thúc:** 2026-05-07  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý lịch sử nâng cấp và thay thế Hệ điều hành (OS) trên từng Server. Đảm bảo tính truy vết (Traceability) khi thực hiện chuyển đổi version OS.

## 2. Kiến trúc OS Tracking (Architecture)

- **Model `ServerOsHistory`:** Lưu vết các bản cài đặt OS theo thời gian.
- **Logic:** Một server tại một thời điểm chỉ có một bản OS hoạt động (Active).

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Lifecycle Logic)
- **Transactional Upgrade:** Khi thực hiện nâng cấp OS (`Install OS` API), backend sử dụng Transaction để:
  1. Đánh dấu bản OS hiện tại là `REPLACED` và cập nhật ngày gỡ bỏ.
  2. Tạo bản ghi OS mới với trạng thái `ACTIVE`.
- **Validation:** Chặn việc xoá OS nếu OS đó là bản duy nhất và đang hoạt động trên server.

### 3.2. Tầng Frontend (OS Lifecycle UI)
- **Timeline View:** Sử dụng component `Timeline` để hiển thị quá trình thay đổi OS của server từ lúc khởi tạo đến hiện tại.
- **Badge Status:** Sử dụng các nhãn màu (`blue` cho Active, `gray` cho Replaced) để phân biệt trạng thái OS trong lịch sử.
- **Form Install:** Cho phép chọn OS từ danh mục (`SYSTEM` apps) và nhập ngày cài đặt, phiên bản chi tiết.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/servers/:id/os` | `GET` | Lấy lịch sử OS của Server | `VIEWER` |
| `/servers/:id/install-os` | `POST` | Nâng cấp/Cài mới OS | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Overlapping Dates:** Backend kiểm tra ngày cài đặt mới không được trước ngày cài đặt cũ nhất trong lịch sử.

## 6. Hướng dẫn Bảo trì & Debug

- **OS Catalog:** Danh sách OS được lấy từ module Application Catalog (Loại SYSTEM).

---

## 7. Metrics & Tasks

- Story Points: 12
- Tasks: 5 (OS History Schema, Upgrade logic, Timeline UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
