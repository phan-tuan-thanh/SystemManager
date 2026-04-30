# Sprint 20 — UI/UX Polish: Import Consistency, Bulk Actions & Form Modernization

**Mục tiêu:** Cải thiện trải nghiệm người dùng đồng nhất trên toàn hệ thống: trang import server dùng drop zone giống app-import, bổ sung hướng dẫn còn thiếu, thêm check-all cho nhóm ứng dụng, cải thiện form nhập phần cứng và layout form chung.

**Branch:** `feat/sprint-20-ux-polish`
**Plan created:** 2026-04-30

---

## 1. [FE] Import Server — Dragger + Steps Wizard *(added 2026-04-30)*

**Yêu cầu:** Trang `infra-upload` hiện dùng nút Upload đơn giản, không nhất quán với trang `app-upload` (dùng Dragger + Steps). Cần đồng nhất trải nghiệm: drop zone + wizard 4 bước.

**Story points:** 3

### Thành phần Frontend
- **Trang:** `pages/infra-upload/index.tsx`
- **Thay đổi:** Thêm `<Steps>` 4 bước (Upload → Ánh xạ cột → Xem trước → Hoàn tất), thay `<Upload>` button bằng `<Dragger>`, tự chuyển bước sau khi file được parse

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S20-01 | `[FE]` | Refactor `infra-upload/index.tsx`: thêm Steps + Dragger, wizard flow 4 bước | 3 |

---

## 2. [DOCS] Cập nhật Hướng dẫn Còn Thiếu *(added 2026-04-30)*

**Yêu cầu:** GuidePage thiếu mục "Import CSV" trong sidebar. Nội dung `import.md` cũ, chưa mô tả đúng flow 4-bước wizard hoặc import kết nối. Cần bổ sung menu item + cập nhật nội dung help docs.

**Story points:** 2

### Thành phần
- `packages/frontend/src/pages/guide/GuidePage.tsx` — thêm menu item `import` trong nhóm HƯỚNG DẪN MODULE
- `packages/backend/content/help/vi/import.md` — rewrite mô tả đúng flow hiện tại (server + app/deployment/connection + wizard steps)
- `packages/backend/content/help/vi/guide_infra.md` — bổ sung Bước import server hàng loạt

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S20-02 | `[FE/DOCS]` | GuidePage: thêm menu item "Import CSV"; cập nhật `import.md` + `guide_infra.md` | 2 |

---

## 3. [FE] AppGroupList — Check-All & Bulk Delete *(added 2026-04-30)*

**Yêu cầu:** Trang danh sách nhóm hạ tầng (infra-system) đã có check-all bulk delete. Trang nhóm ứng dụng (AppGroupList) chưa có. Cần thêm rowSelection + Popconfirm bulk delete đồng nhất.

**Story points:** 2

### Thành phần Frontend
- `pages/application/components/AppGroupList.tsx` — thêm `selectedRowKeys`, rowSelection, bulk delete button

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S20-03 | `[FE]` | AppGroupList: thêm rowSelection + bulk delete (Popconfirm) | 2 |

---

## 4. [FE] HardwareTab — Key-Value Pair Specs Editor *(added 2026-04-30)*

**Yêu cầu:** Form `HardwareForm` hiện dùng JSON textarea cho trường `specs`. User phải biết JSON để nhập. Thay bằng UI nhập cặp key-value trực quan (thêm/xóa từng cặp), vẫn serialize ra JSON khi submit.

**Story points:** 3

### Thành phần Frontend
- `pages/server/components/HardwareTab.tsx` — thêm `SpecsEditor` component inline (list key-value pairs + Add/Remove)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S20-04 | `[FE]` | HardwareTab: thay JSON textarea bằng key-value pair editor (Form.List) | 3 |

---

## 5. [FE] UX Forms — Row/Col Layout Thông minh *(added 2026-04-30)*

**Yêu cầu:** Các form tạo mới/cập nhật (ServerForm Modal, ApplicationForm Drawer, AppGroupModal) có tất cả fields chiếm 100% width, trông không hiện đại. Cần dùng Row/Col để ghép các field ngắn cạnh nhau.

**Story points:** 3

### Thành phần Frontend
- `pages/server/components/ServerForm.tsx` — ghép code/name, environment/site, status/purpose theo Row 2 cols
- `pages/application/components/ApplicationForm.tsx` — ghép code/name, version/owner_team theo Row 2 cols
- `pages/application/components/AppGroupModal.tsx` — ghép code/group_type theo Row 2 cols

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S20-05 | `[FE]` | ServerForm, ApplicationForm, AppGroupModal: Row/Col 2-column layout | 3 |

---

## Tổng Sprint 20: 13 points

| Task | Points | Status |
|------|--------|--------|
| S20-01 Import Server Dragger+Steps | 3 | ⬜ |
| S20-02 Guide docs update | 2 | ⬜ |
| S20-03 AppGroup bulk delete | 2 | ⬜ |
| S20-04 Hardware key-value editor | 3 | ⬜ |
| S20-05 Forms Row/Col layout | 3 | ⬜ |
