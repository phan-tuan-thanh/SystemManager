# Sprint 21 — Hệ thống ChangeSets & So sánh Phiên bản

**Ngày bắt đầu:** 2026-05-20  
**Ngày kết thúc:** 2026-05-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng công cụ so sánh sự thay đổi của hệ thống giữa các thời điểm (Snapshot Comparison). Giúp Admin nắm bắt nhanh các thay đổi về hạ tầng và ứng dụng sau mỗi kỳ nâng cấp.

## 2. Kiến trúc So sánh (Comparison Architecture)

- **Source:** Dữ liệu Audit Log (Snapshots).
- **Logic:** Thuật toán `diff` so sánh các trường dữ liệu trong JSON.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Diff Engine)
- **JSON Deep Diff:** Backend thực hiện so sánh hai bản ghi Snapshot của cùng một tài nguyên. Bóc tách ra các trường bị Thay đổi, Thêm mới hoặc Xoá bỏ.
- **ChangeSet Generation:** Nhóm các thay đổi liên quan trong cùng một phiên làm việc (Session) thành một ChangeSet duy nhất để dễ quản lý.

### 3.2. Tầng Frontend (Visual Diff UI)
- **Side-by-Side View:** Hiển thị hai cột dữ liệu Cũ và Mới. Các phần thay đổi được tô màu (Đỏ cho xoá, Xanh cho thêm).
- **Timeline Integration:** Cho phép chọn các mốc thời gian trên Timeline để thực hiện so sánh nhanh.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/changesets/compare` | `POST` | Thực hiện diff 2 snapshots | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 5 (Diff logic, Comparison UI, Snapshot selector)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
