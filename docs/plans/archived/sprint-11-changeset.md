# Kế hoạch triển khai — Sprint 11: ChangeSet Draft & Preview

**Dự án:** SystemManager  
**Mục tiêu:** Cung cấp quy trình làm việc (workflow) ChangeSet cho phép tích lũy các thay đổi dưới dạng bản nháp (draft), xem trước (preview) tác động và cảnh báo xung đột dữ liệu (port, IP, circular deps) trước khi áp dụng chính thức (apply) vào hệ thống.

---

## 1. Thành phần Backend ([BE])

### 1.1. ChangeSet & ChangeItem CRUD
- **Mối quan hệ:** Quản lý vòng đời `ChangeSet` (DRAFT → PREVIEWING → APPLIED / DISCARDED) và các thực thể thay đổi nhỏ lẻ `ChangeItem` (ghi rõ Resource ID, Resource Type, Action, Old Value, New Value).
- **Chức năng:** API endpoint cho phép người dùng tạo, danh sách (filter), xem chi tiết hoặc discard ChangeSet. Cho phép add/remove một ChangeItem từ một ChangeSet đang ở trạng thái DRAFT.
- **Bảo mật & Module Check:** Đảm bảo module `CHANGESET` bật (ENABLED) thì logic API mới khả dụng.

### 1.2. Preview Engine & Logic Validation
- **Chức năng Preview:** Kết hợp Topology hiện tại với các thao tác `CREATE`/`UPDATE`/`DELETE` chưa chính thức nằm trong ChangeSet, tính toán thành một mô hình hạ tầng giả lập (virtual representation).
- **Validation:** Chạy chuỗi kịch bản kiểm thử (Conflict engine):
    - Có xảy ra IP conflict trong cùng environment do thiết lập server/network mới không?
    - Có xảy ra Port conflict trên cùng server physical/VM do ánh xạ từ application không?
    - Xuất hiện Circular dependencies giữa các cụm applications không?

### 1.3. Apply Transaction & Snapshot
- **Transaction (Nguyên vẹn ACID):** Tiến hành commit vòng lặp ChangeItem xuống DB thực (Live data). Bắt buộc phải áp dụng transaction để rollback toàn bộ nếu có một thao tác lỗi.
- **Hook Snapshot:** Cấu hình tự động gọi Service tạo snapshot của module `TopologySnapshot` ngay lập tức để lưu lại trạng thái hệ thống sau khi quá trình thay đổi thành công rực rỡ, kèm ghi `AuditLog` với flag người apply ChangeSet.

---

## 2. Thành phần Frontend ([FE])

### 2.1. App-wide Draft Mode Interceptor
- **Draft Mode:** Trạng thái Context/Zustand kiểm tra xem user có đang ở "Draft mode" dưới context của 1 ChangeSet cụ thể hay không.
- **Hành vi chặn (Intercept):** Thay vì gửi request PUT/POST trực tiếp lên backend update thông tin Server, App, IP (trong các form có sẵn), Frontend chặn lại và format payload thành Action push lên `ChangeItem` của ChangeSet hiện tại.

### 2.2. ChangeSet Manager & Detail View
- **Trang danh sách (`/changesets`):** Data Table hiển thị các đề xuất thay đổi, lọc được theo status (`DRAFT`, `APPLIED`, etc.), môi trường, người tạo.
- **Trang chi tiết ChangeSet:** View bảng chứa `ChangeItem`, sử dụng module JSON format/Diff để chia cột so sánh **Old Value** VS **New Value**. Các action: Discard, Edit draft, Proceed to Preview.

### 2.3. Topology Preview View
- **Renderer trực quan:** Load sơ đồ mạng (2D/3D) dựa trên JSON payload đã được backend hòa trộn.
- **Highlight Color Coding:**  
  - Xanh lá: Resource mới tạo `[NEW]`.
  - Vàng / Cam: Resource bị chỉnh sửa cấu hình `[MODIFIED]`.
  - Đỏ gạch: Resource bị loại bỏ `[DELETED]`.
- **Cảnh báo xung đột (Warning Panel):** Sidebar hiển thị lỗi validate (Port, Route IP, Circular) thu về từ backend. Disable thao tác *Apply* nếu có Warning chí mạng.

---

## 3. Chi tiết tác vụ & Danh sách File tác động

### TASK 1 — [BE] CRUD ChangeSet & ChangeItem
- **File:** `packages/backend/src/modules/changeset/changeset.module.ts` (new)
- **File:** `packages/backend/src/modules/changeset/changeset.service.ts` & `changeset.controller.ts`
  - Các API: `POST /changesets`, `GET /changesets`, `POST /changesets/:id/items`.

### TASK 2 — [BE] Preview Engine & Validation Validation
- **File:** `packages/backend/src/modules/changeset/changeset.preview-engine.ts` (new service / class)
  - Method ảo hoá Topology Graph: `previewTopology(setId)`
  - Validation: Cả IP subnet logic và Port duplicate logic.

### TASK 3 — [BE] Transactional Apply & Auto Snapshot
- **File:** `packages/backend/src/modules/changeset/changeset.service.ts`
  - Dùng Prisma `$transaction()` lặp qua list item, áp dụng dựa trên `Resource Type`.
  - Bắn trigger (hoặc gọi service) sang topology-snapshot.

### TASK 4 — [FE] Draft Mode & Form Interception
- **File:** `packages/frontend/src/stores/useChangeSetStore.ts` (zustand store để bật/tắt mode intercept)
- **File:** Nơi config các form (ví dụ ServerForm, AppForm) dùng flag từ `useChangeSetStore` thay đổi target API qua `addChangeItem` action.

### TASK 5 — [FE] ChangeSet UI & List/Detail View
- **File:** `packages/frontend/src/pages/changesets/ChangeSetListPage.tsx`
- **File:** `packages/frontend/src/pages/changesets/ChangeSetDetailPage.tsx`
  - Cần thêm module view Diff/JSON chuyên dụng.

### TASK 6 — [FE] Topology Preview Mode
- **File:** `packages/frontend/src/pages/changesets/ChangeSetPreviewPage.tsx`
- Tái sử dụng component ReactFlow/Three Fiber từ module Topology, nhưng truyền một `previewState` qua Context hoặc Props để set quy tắc màu riêng (Đỏ / Xanh / Vàng).

---

## 4. Danh sách Story Points (Tổng kết)

| Task ID | Nội dung phân việc | Points | Role |
|---|---|:---:|:---:|
| **S11-01** | `[BE]` ChangeSet CRUD: create, list, get, discard | 5 | BE |
| **S11-02** | `[BE]` ChangeItem: add/remove item trong draft | 3 | BE |
| **S11-03** | `[BE]` Preview engine: compute topology với ChangeItems overlaid | 8 | BE |
| **S11-04** | `[BE]` Preview validation: port conflict, IP conflict, circular deps | 5 | BE |
| **S11-05** | `[BE]` Apply ChangeSet: transaction apply + auto-snapshot | 8 | BE |
| **S11-06** | `[FE]` ChangeSet list page (filter status, env, creator) | 3 | FE |
| **S11-07** | `[FE]` ChangeSet detail: ChangeItem list với old/new values diff | 5 | FE |
| **S11-08** | `[FE]` Preview mode: render topology diff trên graph (green/red/yellow) | 8 | FE |
| **S11-09** | `[FE]` Preview: warning panel (conflicts detected) | 3 | FE |
| **S11-10** | `[FE]` Apply confirm dialog + discard confirm | 2 | FE |
| **S11-11** | `[FE]` Draft mode: intercept edit actions → add to ChangeSet | 8 | FE |

**Tổng Sprint 11: 58 Story Points**

---

## 5. Tài liệu tham khảo
- **SRS Section 4.5.2:** Draft & Preview — kiểm tra trước khi cập nhật hiện trạng.
- **TASKS.md:** Hạng mục S11 (Sprint 11).
- **Mã nguồn liên quan sẵn có:** Các model `Topology` và Prisma `ChangeSet`, `ChangeItem`.

---

_Kế hoạch được soạn thảo bởi: Kilo Agent_  
_Ngày cập nhật: 2026-04-21_
