# Sprint 17 — Deployment Upload UI

**Mục tiêu:** Bổ sung trang UI cho phép import hàng loạt deployment records từ file CSV, hoàn chỉnh bộ 3 upload flow: Server → Application → Deployment.

**Branch:** `feat/sprint-17-deployment-upload`  
**Thời gian:** 2026-04-25  
**SRS Ref:** 4.4.2, 4.7.4  

---

## Bối cảnh

Hệ thống đã có:
- `/infra-upload` — import Server
- `/app-upload` — import Application

Backend `POST /api/v1/import/preview?type=deployment` và `POST /api/v1/import/execute` đã hỗ trợ `type=deployment` nhưng chưa có UI tương ứng. Người dùng phải dùng curl/Postman để import deployment — không thuận tiện.

Thêm vào đó, `importDeployment` trong backend luôn `create` mới (không upsert), dẫn đến duplicate records nếu import cùng file nhiều lần.

---

## 1. [BE] Fix importDeployment — Upsert thay vì Create

**Story points:** 2  
**Files:**
- `packages/backend/src/modules/import/import.service.ts` — update `importDeployment`, thêm `DEPLOYMENT_HEADER_ALIASES`

**Logic upsert:** Tìm deployment tồn tại theo `(application_id, server_id, environment, deleted_at = null)`. Nếu đã tồn tại → update `version`, `status`, `deployer`. Nếu chưa → create mới.

**Header aliases bổ sung:**
```typescript
const DEPLOYMENT_HEADER_ALIASES = {
  app_code: 'application_code',
  application: 'application_code',
  server: 'server_code',
  host: 'server_code',
  host_code: 'server_code',
  env: 'environment',
  ver: 'version',
  deployed_by: 'deployer',
  team: 'deployer',
};
```

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S17-01 | `[BE]` | Thêm `DEPLOYMENT_HEADER_ALIASES` vào validateRows | 1 |
| S17-02 | `[BE]` | Refactor `importDeployment`: upsert theo (app+server+env) | 1 |

---

## 2. [FE] Trang Deployment Upload

**Story points:** 5  
**Route:** `/deployment-upload`  
**Files:**
- `packages/frontend/src/pages/deployment-upload/index.tsx` — new page
- `packages/frontend/src/App.tsx` — add route
- `packages/frontend/src/components/layout/Sidebar.tsx` — add menu item

**Cột CSV → Target fields:**

| Target key | Label | Bắt buộc | Giá trị hợp lệ |
|-----------|-------|----------|----------------|
| `application_code` | Mã ứng dụng | ✅ | Khớp code trong Application |
| `server_code` | Mã server | ✅ | Khớp code trong Server |
| `environment` | Môi trường | ✅ | DEV / UAT / PROD |
| `version` | Phiên bản | ✅ | Chuỗi tự do |
| `status` | Trạng thái | — | RUNNING / STOPPED / DEPRECATED |
| `deployer` | Người triển khai | — | Chuỗi tự do |

**Value aliases cho enum fields:**
- `environment`: `dev→DEV`, `prod→PROD`, `production→PROD`, `uat→UAT`, `staging→UAT`
- `status`: `running→RUNNING`, `stopped→STOPPED`, `deprecated→DEPRECATED`, `inactive→STOPPED`

**UI flow (4 steps — giống app-upload):**
1. **Tải file** — drag & drop CSV/Excel
2. **Ánh xạ cột** — ColumnMapper + ValueMapper
3. **Xem trước & Kiểm tra** — DataTable preview với inline edit
4. **Hoàn tất Import** — Result view với summary stats + error table

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S17-03 | `[FE]` | Tạo `pages/deployment-upload/index.tsx` | 3 |
| S17-04 | `[FE]` | Thêm route `/deployment-upload` vào `App.tsx` | 1 |
| S17-05 | `[FE]` | Thêm menu item "Upload Deployment" vào Sidebar | 1 |

---

## Definition of Done

- [ ] S17-01: Header aliases hoạt động, validateRows map đúng cột
- [ ] S17-02: Re-import cùng file không tạo duplicate deployment
- [ ] S17-03: Page UI hiển thị đúng 4 bước, preview table có inline edit
- [ ] S17-04: Route `/deployment-upload` accessible sau login
- [ ] S17-05: Sidebar hiển thị "Upload Deployment" dưới nhóm "Ứng dụng"
- [ ] TypeScript không có lỗi mới
- [ ] Import demo `deployments.csv` thành công: 56 records created

---

## Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

# Preview
curl -s -X POST "http://localhost:3000/api/v1/import/preview?type=deployment" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@demo/csv/deployments.csv" | jq '.data.summary'

# Execute (dùng session_id từ preview)
curl -s -X POST "http://localhost:3000/api/v1/import/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<session_id>"}' | jq '.data.summary'
```
