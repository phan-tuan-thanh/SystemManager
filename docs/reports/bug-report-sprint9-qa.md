# Bug Report — Sprint 9 QA (2026-04-17)

## Tổng quan

Kiểm tra sau khi merge `feat/sprint-8-topology-2d` → `main`. Phát hiện 3 lỗi cần sửa trước khi tiếp tục Sprint 9.

---

## BUG-001 — Trang "Loại tài liệu" tạo mới bị lỗi (field name mismatch)

| Thuộc tính | Giá trị |
|---|---|
| **Mức độ** | High |
| **Trang** | `/admin/doc-types` |
| **Hành động** | Tạo mới loại tài liệu |
| **Trạng thái** | 🔴 Open |

### Mô tả

Toggle "Bắt buộc" trong form tạo mới/chỉnh sửa loại tài liệu không hoạt động đúng. Giá trị luôn bị lưu là `false` bất kể người dùng bật hay tắt.

### Nguyên nhân gốc rễ

Không khớp tên field giữa frontend và backend:

| Layer | Field name |
|---|---|
| Prisma model (`DeploymentDocType`) | `required Boolean` |
| Backend DTO (`CreateDocTypeDto`) | `required?: boolean` |
| Frontend type (`DeploymentDocType`) | `is_required: boolean` ← **sai** |
| Frontend form (`name=`) | `"is_required"` ← **sai** |

**Luồng lỗi:**
1. Form submit gửi `{ is_required: true/false, ... }` lên backend
2. Backend có `ValidationPipe({ whitelist: true })` → strip field `is_required` (không có trong DTO)
3. `dto.required` = `undefined` → Prisma dùng default `false`
4. Giá trị "Bắt buộc" không bao giờ được lưu đúng

### Files bị ảnh hưởng

- `packages/frontend/src/types/deployment.ts` — type field `is_required`
- `packages/frontend/src/pages/admin/DeploymentDocTypePage.tsx` — form field name, dataIndex, setFieldsValues
- `packages/frontend/src/pages/deployment/components/DocUploadCard.tsx` — render condition `doc.doc_type.is_required`

### Kế hoạch sửa

Đổi tất cả `is_required` → `required` ở frontend để khớp với Prisma schema và backend DTO.

---

## BUG-002 — Trang Audit Log: pageSize không cập nhật query

| Thuộc tính | Giá trị |
|---|---|
| **Mức độ** | Medium |
| **Trang** | `/audit-logs` |
| **Hành động** | Đổi số lượng bản ghi/trang (pageSize) |
| **Trạng thái** | 🔴 Open |

### Mô tả

Người dùng thay đổi pageSize trong pagination control nhưng số lượng bản ghi trả về từ API không thay đổi (luôn là 20).

### Nguyên nhân gốc rễ

```tsx
// AuditLogPage.tsx — line 118
const [limit] = useState(20);  // ← không có setter!

// DataTable prop sai tên
<DataTable
  limit={limit}        // ← DataTable không có prop "limit", phải là "pageSize"
  onPageChange={setPage}  // ← chỉ cập nhật page, không cập nhật limit
/>
```

`DataTable` có `showSizeChanger: true` nhưng `onPageChange(page, pageSize)` chỉ được bind với `setPage` — `pageSize` argument bị bỏ qua.

### Kế hoạch sửa

- Thêm state `[limit, setLimit] = useState(20)`
- Sửa prop `limit` → `pageSize={limit}`
- Sửa `onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}`
- Cập nhật API query sử dụng `limit` state

---

## BUG-003 — Trang Người dùng & Nhóm người dùng: pageSize không cập nhật query

| Thuộc tính | Giá trị |
|---|---|
| **Mức độ** | Medium |
| **Trang** | `/admin/users`, `/admin/user-groups` |
| **Hành động** | Đổi số lượng bản ghi/trang |
| **Trạng thái** | 🔴 Open |

### Mô tả

Tương tự BUG-002. Cả `UsersPage` và `UserGroupsPage` hardcode `limit: 20` trong API query và `pageSize={20}` trong DataTable. Khi người dùng đổi pageSize, UI cập nhật nhưng API vẫn trả 20 bản ghi.

### Nguyên nhân gốc rễ

```tsx
// UsersPage.tsx — line 281
useUserList({ page, limit: 20, ... })  // ← hardcoded
// DataTable
<DataTable pageSize={20} onPageChange={setPage} />  // ← hardcoded, onPageChange chỉ set page
```

### Kế hoạch sửa

Tương tự BUG-002: thêm `limit` state và bind vào cả API query và DataTable.

---

## Tóm tắt

| Bug | File | Loại | Độ ưu tiên |
|---|---|---|---|
| BUG-001 | `types/deployment.ts`, `DeploymentDocTypePage.tsx`, `DocUploadCard.tsx` | Logic | High |
| BUG-002 | `AuditLogPage.tsx` | UI/UX | Medium |
| BUG-003 | `UsersPage.tsx`, `UserGroupsPage.tsx` | UI/UX | Medium |
