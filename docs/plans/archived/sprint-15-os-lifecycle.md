# Sprint 15 (Extension): OS Lifecycle Tracking

**Mô tả:** Thay thế `server.os` string bằng hệ thống OS catalog + lịch sử cài đặt có đầy đủ metadata (ai cài, khi nào, tại sao). Tích hợp bước OS Resolution vào Import wizard.

**Lý do:** `server.os` là string thô, không có lịch sử, không có liên kết catalog. Khi tên Application thay đổi thì `server.os` diverge. Cần single source of truth và immutable history per thay đổi.

**Phụ thuộc:** Sprint 15 base (S15-01 → S15-07) đã hoàn thành.

---

## Kiến trúc tổng thể

```
Application (type=SYSTEM, sw_type='OS')   ← catalog: tên sản phẩm OS
        ↑
ServerOsInstall                           ← mỗi record = 1 lần cài/nâng cấp
├── server_id → Server
├── application_id → Application(SYSTEM)
├── version: String                        ← patch/build cụ thể
├── installed_at: DateTime                 ← bắt buộc
├── installed_by_id → User?
├── replaced_at: DateTime?                 ← null = đang active
├── change_reason: String?                 ← bắt buộc khi upgrade
├── change_ticket: String?                 ← CR/JIRA ticket
└── notes: String?

Server
├── ~~os: String~~                         ← XÓA, derive từ catalog
└── current_os_install_id → ServerOsInstall?  ← pointer đến active record
```

**Display string** tại query time:
```
os_display = Application.name + " " + ServerOsInstall.version
```

**Quy tắc bất biến:**
- Không UPDATE hoặc DELETE `ServerOsInstall` cũ — chỉ set `replaced_at`
- `installed_at` bắt buộc ở application level (không default `now()` tự động)
- `change_reason` bắt buộc khi upgrade (optional chỉ khi import lần đầu)

---

## Task S15-08: [BE] Schema — ServerOsInstall + migrate server.os

**Story points:** 3

### Thay đổi Prisma schema

**Thêm model `ServerOsInstall`:**
```prisma
model ServerOsInstall {
  id             String    @id @default(uuid()) @db.Uuid
  server_id      String    @db.Uuid
  application_id String    @db.Uuid
  version        String    @db.VarChar(100)
  installed_at   DateTime
  installed_by_id String?  @db.Uuid
  replaced_at    DateTime?
  change_reason  String?   @db.VarChar(500)
  change_ticket  String?   @db.VarChar(100)
  notes          String?   @db.Text
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  server      Server      @relation(fields: [server_id], references: [id])
  application Application @relation(fields: [application_id], references: [id])
  installed_by User?      @relation(fields: [installed_by_id], references: [id])

  @@index([server_id])
  @@index([application_id])
  @@index([server_id, replaced_at])
  @@map("server_os_installs")
}
```

**Cập nhật model `Server`:**
- Xóa trường `os String?`
- Thêm `current_os_install_id String? @db.Uuid`
- Thêm relation `current_os_install ServerOsInstall? @relation(...)`

**Cập nhật model `Application`:**
- Thêm relation `os_installs ServerOsInstall[]`

**Migration steps:**
1. Tạo bảng `server_os_installs`
2. Data migration: với mỗi server có `os != null`, tạo 1 `ServerOsInstall` record:
   - `version = ''` (không có thông tin patch)
   - `installed_at = server.created_at`
   - `change_reason = 'Migrated from legacy os field'`
   - Tìm hoặc tạo `Application(SYSTEM, sw_type='OS')` theo tên `os`
3. Set `server.current_os_install_id` cho mỗi server
4. Drop cột `os` khỏi bảng `servers`

**Files thay đổi:**
- `packages/backend/prisma/schema.prisma`
- `packages/backend/prisma/migrations/YYYYMMDD_add_server_os_install/` (migration file mới)

---

## Task S15-09: [BE] Application — thêm sw_type enum + OS catalog API

**Story points:** 2

### Thay đổi

**Thêm enum `SwType`** vào schema (thay `sw_type String?` trên `SystemSoftware`):
```prisma
enum SwType {
  OS
  MIDDLEWARE
  DATABASE
  RUNTIME
  WEB_SERVER
  OTHER
}
```

Cập nhật `Application` model: thêm `sw_type SwType?` (chỉ relevant khi `application_type = SYSTEM`).

**API endpoint mới:** `GET /api/v1/applications?type=SYSTEM&sw_type=OS`
- Dùng cho dropdown search trong OS Resolution step và form cập nhật OS
- Response trả về `{ id, name, sw_type }` — đủ để render dropdown

**Files thay đổi:**
- `packages/backend/prisma/schema.prisma`
- `packages/backend/src/modules/application/application.service.ts` — thêm filter `sw_type`
- `packages/backend/src/modules/application/dto/query-application.dto.ts` — thêm `sw_type?`

---

## Task S15-10: [BE] ServerOsInstall — CRUD API

**Story points:** 4

### Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/api/v1/servers/:id/os-history` | Lấy toàn bộ lịch sử OS của server |
| `POST` | `/api/v1/servers/:id/os-installs` | Cài/nâng cấp OS (tạo record mới) |

**`POST /api/v1/servers/:id/os-installs` — body:**
```typescript
{
  application_id: string;   // required — Application(SYSTEM, sw_type=OS)
  version: string;          // required
  installed_at: string;     // required — ISO datetime
  change_reason: string;    // required khi server đã có current_os_install_id
  change_ticket?: string;
  notes?: string;
}
```

**Logic `POST`:**
1. Validate `application_id` trỏ đến `Application(type=SYSTEM, sw_type=OS)`
2. Nếu server đã có `current_os_install_id`: set `replaced_at = now()` cho record cũ
3. Tạo `ServerOsInstall` mới với `replaced_at = null`
4. Update `server.current_os_install_id = newRecord.id`
5. Trả về record mới kèm Application name

**Logic `GET` history:**
- Query tất cả `ServerOsInstall` theo `server_id`, include `application.name`
- Order by `installed_at DESC`
- Trả về array (không paginate — lịch sử OS thường < 20 records)

**Files thay đổi:**
- `packages/backend/src/modules/server/server.module.ts`
- `packages/backend/src/modules/server/server.controller.ts`
- `packages/backend/src/modules/server/server.service.ts`
- `packages/backend/src/modules/server/dto/create-os-install.dto.ts` (mới)
- `packages/backend/src/modules/server/entities/os-install.entity.ts` (mới)

---

## Task S15-11: [BE] Cập nhật ImportService — OS Resolution

**Story points:** 3

### Thay đổi logic import server

**Xóa:** Ghi `server.os` string

**Thêm:** Sau khi upsert server, xử lý OS từ field `os` trong mapped row:
1. Nếu có giá trị `os`:
   - Tìm `Application` theo `{ name: osValue, type: SYSTEM, sw_type: OS }` (case-insensitive)
   - Nếu không tìm thấy: tạo mới `Application` với `name = osValue, type = SYSTEM, sw_type = OS`
   - Nếu server chưa có `current_os_install_id`: tạo `ServerOsInstall`:
     - `version = ''`
     - `installed_at = now()`
     - `change_reason = 'Import từ CSV'`
   - Nếu server đã có OS và khác application_id: tạo record mới, set `replaced_at` cho cũ
2. Nếu không có giá trị `os`: bỏ qua, không tạo record

**Lưu ý:** Import không yêu cầu `change_reason` bắt buộc — dùng default `'Import từ CSV'`.

**Files thay đổi:**
- `packages/backend/src/modules/import/import.service.ts`

---

## Task S15-12: [BE] Cập nhật Server query — include OS display

**Story points:** 1

### Thay đổi

Tất cả query trả về Server cần include OS display:

```typescript
// Trong ServerService.findOne(), findAll()
include: {
  current_os_install: {
    include: { application: { select: { name: true } } }
  },
  hardware_components: true,
  network_configs: true,
}
```

Response entity thêm computed field:
```typescript
os_display: server.current_os_install
  ? `${server.current_os_install.application.name} ${server.current_os_install.version}`.trim()
  : null
```

**Files thay đổi:**
- `packages/backend/src/modules/server/server.service.ts`
- `packages/backend/src/modules/server/entities/server.entity.ts`

---

## Task S15-13: [FE] Import wizard — bước OS Resolution

**Story points:** 5

### Vị trí trong wizard

```
[Upload CSV] → [Column Mapping] → [Value Mapping] → [OS Resolution] ← mới → [Preview] → [Execute]
```

Bước OS Resolution chỉ hiển thị nếu cột `os` được map trong Column Mapping.

### Component `OsResolutionStep`

**Input:** Danh sách giá trị OS unique từ CSV (extracted từ `allRows` sau khi apply mapping)

**Hiển thị:** Bảng với mỗi dòng là 1 giá trị OS unique:

| Giá trị trong CSV | Xử lý | Application sẽ dùng |
|---|---|---|
| Windows Server 2019 Datacenter | `[Tạo mới]` | "Windows Server 2019 Datacenter" |
| Windows Server 2016 Standard | `[Map có sẵn ▼]` | dropdown search Application(SYSTEM, OS) |
| *(trống)* | `[Bỏ qua]` | — |

**Trạng thái mỗi dòng:**
- `create`: tạo mới Application, pre-fill name từ CSV value, user có thể sửa name
- `map`: user chọn Application có sẵn từ dropdown (search `GET /applications?type=SYSTEM&sw_type=OS`)
- `skip`: không xử lý OS cho các server có giá trị này

**Output:** `osResolutionMap: Record<csvOsValue, { action: 'create'|'map'|'skip', applicationId?: string, name?: string }>`

Map này được truyền vào preview request để backend biết cách resolve OS.

### Cập nhật preview/execute flow

Preview request thêm field `os_resolution_map` vào FormData (JSON stringify).
Backend ImportService đọc map này để resolve Application thay vì tự tạo blindly.

**Files thay đổi:**
- `packages/frontend/src/pages/infra-upload/index.tsx`
- `packages/frontend/src/components/common/OsResolutionStep.tsx` (mới)
- `packages/frontend/src/hooks/useApplications.ts` — thêm `useOsCatalog()` hook

---

## Task S15-14: [FE] Server Detail — OS History tab/section

**Story points:** 4

### Vị trí

Trong trang Server Detail (`/server/:id`), thêm section **"Lịch sử OS"** trong tab Overview hoặc tab Hardware (cùng vị trí với HardwareTab).

### UI

**Hiển thị current OS:**
```
OS hiện tại: Windows Server 2019 Datacenter  10.0.17763.6659
             Cài ngày: 15/03/2025 | Bởi: admin | Lý do: Patch KB5035849
             [Cập nhật OS]
```

**Bảng lịch sử:**

| | OS | Version | Từ | Đến | Lý do | Ticket |
|---|---|---|---|---|---|---|
| ● | Win Server 2019 DC | 10.0.17763.6659 | 15/03/2025 | (đang dùng) | Patch KB5035849 | CR-025-014 |
| ○ | Win Server 2019 DC | 10.0.17763.5576 | 01/01/2025 | 15/03/2025 | Patch quý 1 | — |
| ○ | Win Server 2016 Std | 10.0.14393.x | 10/06/2023 | 01/01/2025 | Nâng cấp từ 2016 | CR-023-088 |

### Modal "Cập nhật OS"

Fields:
- **OS (Application)** — required, dropdown search catalog `Application(SYSTEM, OS)` + option "Tạo mới"
- **Version** — required, text input (patch/build label)
- **Ngày cài đặt** — required, DatePicker (không default now(), user phải chọn)
- **Lý do** — required, textarea
- **Change ticket** — optional, text input
- **Ghi chú** — optional, textarea

Validation: Tất cả required fields phải có giá trị trước khi Enable nút Lưu.

**Files thay đổi:**
- `packages/frontend/src/pages/server/[id].tsx`
- `packages/frontend/src/pages/server/components/OsHistorySection.tsx` (mới)
- `packages/frontend/src/hooks/useServerOs.ts` (mới) — `useOsHistory(serverId)`, `useInstallOs()`
- `packages/frontend/src/types/server.ts` — thêm `ServerOsInstall` type

---

## Task S15-15: [FE] Cập nhật ServerForm & ServerList

**Story points:** 2

### ServerForm

- Xóa input `os` (string text field cũ)
- Thêm note: *"OS được quản lý qua tab Lịch sử OS sau khi tạo server"*
- Khi create server mới: OS = null cho đến khi user thêm qua OS History section

### ServerList

- Cột `OS` hiển thị `os_display` từ response (computed field từ S15-12)
- Nếu null: hiển thị tag `Chưa ghi nhận` (màu xám)

**Files thay đổi:**
- `packages/frontend/src/pages/server/components/ServerForm.tsx`
- `packages/frontend/src/pages/server/ServerList.tsx` (nếu có cột OS)

---

## Tổng hợp tasks

| Task | Type | Mô tả | Points | Phụ thuộc |
|------|------|-------|--------|-----------|
| S15-08 | `[BE]` | Schema ServerOsInstall + migration | 3 | — |
| S15-09 | `[BE]` | Application sw_type enum + OS catalog API | 2 | S15-08 |
| S15-10 | `[BE]` | ServerOsInstall CRUD API | 4 | S15-08, S15-09 |
| S15-11 | `[BE]` | ImportService — xử lý OS qua catalog | 3 | S15-08, S15-09 |
| S15-12 | `[BE]` | Server query include OS display | 1 | S15-08 |
| S15-13 | `[FE]` | Import wizard — bước OS Resolution | 5 | S15-09, S15-11 |
| S15-14 | `[FE]` | Server Detail — OS History section + modal | 4 | S15-10, S15-12 |
| S15-15 | `[FE]` | ServerForm & ServerList cập nhật | 2 | S15-12 |
| | | **Tổng** | **24** | |

---

## Thứ tự thực hiện

```
S15-08 (Schema)
  ├── S15-09 (sw_type + API)
  │     ├── S15-10 (OS CRUD API)
  │     │     └── S15-14 (FE: OS History UI)
  │     └── S15-11 (ImportService)
  │           └── S15-13 (FE: OS Resolution step)
  └── S15-12 (Server query)
        └── S15-15 (FE: Form + List)
```

Backend (S15-08 → S15-12) phải hoàn thành trước khi bắt đầu Frontend.

---

## Ghi chú về SystemSoftware entity

Model `SystemSoftware` hiện tại (`packages/backend/prisma/schema.prisma`, table `system_software`) là **orphan** — không có server nào link tới. Sau khi sprint này hoàn thành:

- Nếu `system_software` table trống: drop table + model trong sprint tiếp theo
- Nếu có dữ liệu: migrate sang `Application(SYSTEM)` rồi drop

Không xử lý trong sprint này để tránh scope creep.
