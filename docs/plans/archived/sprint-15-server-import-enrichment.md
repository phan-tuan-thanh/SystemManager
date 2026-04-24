# Sprint 15: Server Import & Data Enrichment

**Mô tả:** Refactor cơ chế import server, hỗ trợ OS và thông số phần cứng chi tiết. Đơn giản hóa UI upload.

---

## 1. [BE] Thêm trường OS vào Model Server *(added 2026-04-24)*

**Yêu cầu từ:** Sprint 15 Initialization
**Story points:** 2

### Thành phần Backend
- **Cơ chế:** Thêm cột `os` vào bảng `servers` qua Prisma migration. Cập nhật DTO để nhận dữ liệu từ API.
- **Files thay đổi:**
  - `packages/backend/prisma/schema.prisma` — update
  - `packages/backend/src/modules/server/dto/create-server.dto.ts` — update
  - `packages/backend/src/modules/server/server.service.ts` — update

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S15-01 | `[BE]` | Thêm `os` vào model `Server` (Prisma) | 1 |
| S15-02 | `[BE]` | Cập nhật DTOs & ServerService | 1 |

---

## 2. [BE] Nâng cấp Import Logic *(added 2026-04-24)*

**Yêu cầu từ:** Sprint 15 Initialization
**Story points:** 5

### Thành phần Backend
- **Cơ chế:** Cập nhật `ImportService` để bóc tách cột OS và các cột thông số phần cứng (CPU, RAM, Disk). Tự động tạo/cập nhật `HardwareComponent`.
- **Files thay đổi:**
  - `packages/backend/src/modules/import/import.service.ts` — update

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S15-03 | `[BE]` | Cập nhật ImportService (Mapping OS, Hardware specs) | 5 |

---

## 3. [FE] Refactor Upload UI & Detail View *(added 2026-04-24)*

**Yêu cầu từ:** Sprint 15 Initialization
**Story points:** 8

### Thành phần Frontend
- **Trang/Component:** Refactor `InfraUploadPage` thành `ServerUploadPage`. Hiển thị OS và phần cứng trên trang Detail và Form.
- **Files thay đổi:**
  - `packages/frontend/src/components/layout/Sidebar.tsx` — update
  - `packages/frontend/src/pages/infra-upload/index.tsx` — update
  - `packages/frontend/src/pages/server/[id].tsx` — update
  - `packages/frontend/src/pages/server/components/HardwareTab.tsx` — update
  - `packages/frontend/src/pages/server/components/ServerForm.tsx` — update
  - `packages/frontend/src/types/server.ts` — update

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S15-04 | `[FE]` | Đổi tên "Upload" → "Upload Server" ở Sidebar | 1 |
| S15-05 | `[FE]` | Refactor `InfraUploadPage` thành trang Upload Server | 3 |
| S15-06 | `[FE]` | Hiển thị OS & Hardware specs chi tiết trên UI | 2 |
| S15-07 | `[FE]` | ServerForm: Bổ sung input OS | 2 |
