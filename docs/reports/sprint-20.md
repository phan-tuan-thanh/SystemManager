# Sprint 20 — UI/UX Polish & Bulk Actions

**Ngày bắt đầu:** 2026-04-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Hoàn thiện giao diện (Polish UX) trên toàn hệ thống trước khi đóng gói Phase 1. Đồng nhất trải nghiệm Upload qua Wizard 4 bước, hỗ trợ thao tác hàng loạt (Bulk Delete), và nâng cấp các form nhập liệu phức tạp thành Key-Value editor trực quan.

## 2. Kiến trúc & Schema Database

*Không có thay đổi về Schema DB. Tính năng Bulk Delete tái sử dụng API Delete theo Batch.*

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Luồng Import Wizard (4-bước)
- **Cấu trúc Component:** Hợp nhất luồng Upload CSV thành 4 bước (Step):
  - **Step 1:** Upload File (Dùng Ant Design Dragger với tính năng parse CSV locally qua `papaparse`).
  - **Step 2:** Mapping (Ánh xạ cột tự động dựa trên Header Aliases).
  - **Step 3:** Validation & Review (Hiển thị bảng Preview, tự động check lỗi format, highlight cell lỗi).
  - **Step 4:** Execute (Gọi backend API để import, xử lý progress bar).
- **Trạng thái:** Toàn bộ state của Wizard được quản lý cục bộ tránh ảnh hưởng đến các màn hình khác.

### 3.2. Form Key-Value cho Hardware Specs
- Chuyển đổi từ textarea nhập JSON (dễ sai cú pháp) sang giao diện List (Key-Value) cho thông số phần cứng.
- Sử dụng `Form.List` của Ant Design.
- **Preset Suggestion:** Cung cấp sẵn các Key tiêu chuẩn (như `Cores`, `Threads`, `Speed`, `Capacity`) dựa trên loại linh kiện (Hardware Type) người dùng chọn.

## 4. Đặc tả API Interfaces

*Không có API mới.*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Lỗi Parse CSV:** Nếu file CSV sai encoding (không phải UTF-8) hoặc thiếu cột bắt buộc, hệ thống chặn ngay tại trình duyệt (Step 1) không đẩy lên backend gây tắc nghẽn.
- **Bảo vệ Xoá hàng loạt (Bulk Delete Lock):** API Bulk Delete của AppGroup sẽ tự động `ROLLBACK` và trả lỗi nếu có bất kỳ 1 group nào trong danh sách đang chứa ứng dụng. Giao diện sẽ hiển thị lỗi chi tiết tên Group gây block.

## 6. Hướng dẫn Bảo trì & Debug

- Quy trình Wizard Import hiện là chuẩn cho mọi màn hình (App Import, Deployment Import, v.v.). Khi bảo trì cần chú ý giữ cấu trúc HOC (Higher-Order Component) nếu cần mở rộng.

---

## 7. Metrics & Tasks (Lịch sử công việc)

### Danh sách Tasks
- ✅ S20-01: `infra-upload/index.tsx` — Dragger + Steps 4-bước wizard
- ✅ S20-02: Cập nhật tài liệu hướng dẫn import Markdown
- ✅ S20-03: `AppGroupList.tsx` — rowSelection + bulk delete Popconfirm
- ✅ S20-04: `HardwareTab.tsx` — Form.List key-value editor
- ✅ S20-05: Chuyển đổi Form layout sang 2-column (Server, App, AppGroup)

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì._
