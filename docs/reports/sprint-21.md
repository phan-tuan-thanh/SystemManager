# Sprint 21 — Hệ thống ChangeSets & So sánh Phiên bản

**Ngày bắt đầu:** 2026-05-20  
**Ngày kết thúc:** 2026-05-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng cơ chế Sandbox lưu nháp cấu hình, hỗ trợ xem trước các thay đổi và so sánh sự khác biệt bằng giao diện Diff trực quan.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ChangeSet**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `status` | `String` | Trạng thái phiên thay đổi | `DRAFT`, `APPLIED`, `DISCARDED` |
| `environment` | `String` | Môi trường mục tiêu | |

#### **Model / DTO: ChangeItem**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `action` | `String` | Phân loại hành động | `CREATE`, `UPDATE`, `DELETE` |
| `old_value` | `Json` | Dữ liệu trước thay đổi | |
| `new_value` | `Json` | Dữ liệu sau thay đổi | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Deep JSON Diff Algorithm:** Thuật toán duyệt cây đệ quy, so sánh object JSON hiện tại trong DB với payload DTO đẩy lên để bóc tách ra danh sách các trường (fields) bị thay đổi (modified), trường bị xoá (deleted), trường thêm mới (added). Ghi mảng này vào `ChangeItem`.
- **Dry-run Validation:** Khi user bấm "Apply", Backend dùng Prisma Transaction mô phỏng việc apply các `ChangeItem`. Nếu vi phạm constraint DB (Ví dụ: IP đã bị ai đó chiếm giữa chừng), rollback Transaction và trả lỗi về màn hình Preview. Nếu pass, commit thực sự.

### 3.2. Tầng Frontend (Client-side Logic)
- **Side-by-Side Visual Diff:** Import thư viện `react-diff-viewer`. Render 2 cột: Cột trái (old_value) và Cột phải (new_value).
- **Color Coding:** Phần mềm tự động highlight line màu Xanh lá (Addition), màu Đỏ (Deletion) và màu Vàng (Modification).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/changesets/:id/apply` | `POST` | Duyệt lệnh thực thi trên DB | `ADMIN` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Dry-run Failure (Lỗi 422):** Quá trình chạy thử gặp lỗi logic (Unprocessable Entity).

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Thuật toán Deep JSON Diff có thể xử lý tốn CPU nếu data quá lớn (ví dụ JSON Topology), cần xem xét bỏ qua một số field đặc thù khỏi quá trình Diff.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 5 (Diff engine, ChangeSet logic, Visual Diff UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
