# Sprint 21 — Hệ thống ChangeSets & So sánh Phiên bản

**Ngày bắt đầu:** 2026-05-20  
**Ngày kết thúc:** 2026-05-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng cơ chế lưu nháp các thay đổi (DRAFT) và so sánh sự khác biệt (Diff) trước khi áp dụng chính thức vào hệ thống.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: ChangeSet**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `status` | `String` | `DRAFT`, `APPLIED`, `DISCARDED` | Default: `DRAFT` |
| `environment` | `String` | Môi trường áp dụng thay đổi | |

#### **Model: ChangeItem (JSON Diff)**
| Field | Type | Description |
|---|---|---|
| `action` | `String` | `CREATE`, `UPDATE`, `DELETE` |
| `old_value` | `Json` | Snapshot dữ liệu cũ |
| `new_value` | `Json` | Dữ liệu thay đổi mới |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Comparison Engine)
- **Deep JSON Diff:** Sử dụng thuật toán so sánh đệ quy để tìm ra sự khác biệt giữa hai bản ghi JSON. Kết quả trả về danh sách các trường bị thay đổi kèm theo giá trị cũ và mới.
- **Dry-run Execution:** Trước khi `Apply`, Backend thực hiện một phiên chạy thử (Dry-run) để kiểm tra xem các thay đổi có gây ra lỗi ràng buộc Database nào không (VD: trùng IP, trùng Port).

### 3.2. Tầng Frontend (Visual Diff)
- **Side-by-Side Comparison:** Hiển thị bảng so sánh hai cột. Các dòng thay đổi được highlight màu sắc: **Xanh lá** (Thêm), **Vàng** (Sửa), **Đỏ** (Xoá).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/changesets/:id/apply` | `POST` | Áp dụng thay đổi vào DB | `ADMIN` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 5 (Diff engine, ChangeSet logic, Visual Diff UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
