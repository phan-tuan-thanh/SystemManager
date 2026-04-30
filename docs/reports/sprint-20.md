# Sprint 20 Report — UI/UX Polish: Import Consistency, Bulk Actions & Form Modernization

**Cập nhật:** 2026-04-30  
**Branch:** `feat/sprint-20-ux-polish`  
**Tổng story points:** 13 / 13 ✅

---

## Tính năng đã implement

### S20-01: Import Server — Dragger + Steps Wizard
- **File:** `packages/frontend/src/pages/infra-upload/index.tsx`
- **Thay đổi:** Toàn bộ trang refactor sang wizard 4 bước (Steps component + Dragger)
  - Bước 0: Drop zone (`<Dragger>`) thay nút Upload — tự chuyển bước sau khi parse xong file
  - Bước 1: Ánh xạ cột + Value Mapping (giữ nguyên logic)
  - Bước 2: Xem trước & Kiểm tra (giữ nguyên logic preview table)
  - Bước 3: Kết quả (`<Result>` component giống app-import)
- Trải nghiệm đồng nhất 100% với trang app-import

### S20-02: Cập nhật Guide — Import CSV
- **File:** `packages/frontend/src/pages/guide/GuidePage.tsx`
  - Thêm menu item `import` → "Import CSV (hàng loạt)" vào nhóm HƯỚNG DẪN MODULE
- **File:** `packages/backend/content/help/vi/import.md`
  - Rewrite toàn bộ — mô tả đúng wizard 4 bước hiện tại
  - Bảng cột bắt buộc cho Server / Ứng dụng / Deployment / Connection
  - Hướng dẫn import Connection (source_app, target_app, environment)
- **File:** `packages/backend/content/help/vi/guide_infra.md`
  - Bổ sung Bước 2b "Import hàng loạt từ CSV" với hướng dẫn step-by-step

### S20-03: AppGroupList — Bulk Delete
- **File:** `packages/frontend/src/pages/application/components/AppGroupList.tsx`
- Thêm `rowSelection` (checkbox), `selectedRowKeys` state
- Bulk delete button với `Popconfirm` khi có ≥1 row được chọn
- Đồng nhất pattern với `infra-system/index.tsx`

### S20-04: HardwareTab — Key-Value Spec Editor
- **File:** `packages/frontend/src/pages/server/components/HardwareTab.tsx`
- Thay `Input.TextArea` (JSON) bằng `Form.List` key-value pairs
- Preset key gợi ý theo loại phần cứng (CPU → cores/threads; RAM → gb; HDD/SSD → size_gb; v.v.)
- Click tag gợi ý để thêm nhanh key
- Serialize `KvPair[]` → `Record<string, string>` khi submit; parse ngược khi edit

### S20-05: Forms — Row/Col 2-Column Layout
- **`ServerForm.tsx`:** code+name, hostname+environment, status+site, purpose+infra_type ghép 2 cột
- **`ApplicationForm.tsx`:** application_type+group_id, code+name, status+version, owner_team+tech_stack ghép 2 cột (riêng cho BUSINESS/SYSTEM type)
- **`AppGroupModal.tsx`:** code+group_type ghép 2 cột

---

## Known Issues
- TypeScript check không chạy được local (Docker-based dev, node_modules không mount ra ngoài). Code patterns đã được verify thủ công.
- `destroyOnHidden` trên Modal là prop của antd 5.x — đúng pattern codebase hiện tại.
