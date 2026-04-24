# Sprint 16 — Application Group Restructure & Catalog Unification

**Status:** Draft — chờ chốt trước khi code  
**Branch đích:** `feat/sprint-16-app-group-restructure` (branch từ `main`)  
**Mục tiêu:** Thêm `group_type` vào `ApplicationGroup` để phân biệt nhóm nghiệp vụ / hạ tầng; hợp nhất `SystemSoftware` vào `Application`; cập nhật toàn bộ UI/API theo đúng phân loại.

---

## 1. Bối cảnh & Vấn đề hiện tại

### 1.1 Sơ đồ dữ liệu hiện tại

```
ApplicationGroup  (code, name, description — KHÔNG có type)
  ├── Application  (application_type = BUSINESS | SYSTEM,  sw_type = OS | MIDDLEWARE | ...)
  │     ├── AppDeployment  (deploy lên server)
  │     ├── AppConnection  (kết nối giữa các app)
  │     ├── Port
  │     └── ServerOsInstall  (lịch sử cài OS, trỏ application_id)
  └── SystemSoftware  (name, version, sw_type, eol_date — KHÔNG có code, application_type)
```

### 1.2 Vấn đề cụ thể

| # | Vấn đề | Bằng chứng trong code |
|---|--------|----------------------|
| 1 | `ApplicationGroup` không có `group_type` | Schema `ApplicationGroup`: chỉ có `code`, `name`, `description` |
| 2 | `ApplicationForm.tsx` hiển thị **toàn bộ** nhóm không lọc | `useAppGroupList({ limit: 100 })` không truyền `group_type` filter |
| 3 | Frontend type `Application` **thiếu** `application_type`, `sw_type` | `types/application.ts` — interface `Application` không có 2 field này |
| 4 | `ApplicationForm.tsx` không cho chọn `application_type` hay `sw_type` | Form chỉ có `group_id`, `code`, `name`, `status`, `version`, `owner_team`, `tech_stack`, `repo_url` |
| 5 | Hai catalog song song: `Application(type=SYSTEM)` và `SystemSoftware` | OS import → `Application`; trang `/system-software` đọc → `SystemSoftware` ≠ nhau |
| 6 | `SystemSoftware` thiếu `code`, `application_type` | Schema `SystemSoftware`: chỉ có `name`, `version`, `sw_type`, `eol_date` |
| 7 | `_count` của `ApplicationGroup` bao gồm `system_software` | Backend service: `_count: { select: { applications: true, system_software: true } }` |

---

## 2. Giải pháp thiết kế

### 2.1 Thêm `group_type` vào `ApplicationGroup`

**Enum mới:**
```prisma
enum GroupType {
  BUSINESS       // Nhóm ứng dụng nghiệp vụ: ERP, CRM, Banking...
  INFRASTRUCTURE // Nhóm phần mềm hạ tầng: OS, DB, Middleware, Runtime...
}
```

**Schema change:**
```prisma
model ApplicationGroup {
  // ... fields hiện có ...
  group_type  GroupType  @default(BUSINESS)   // THÊM MỚI
}
```

**Quy tắc ràng buộc (enforce ở service layer):**
- `Application(application_type = BUSINESS)` → `group.group_type` phải là `BUSINESS`
- `Application(application_type = SYSTEM)` → `group.group_type` phải là `INFRASTRUCTURE`
- `SystemSoftware` (trước khi migrate) → `group.group_type` phải là `INFRASTRUCTURE`

**Migration data logic** (chạy trong cùng migration):
```sql
-- Nhóm đã có Application(type=SYSTEM) → INFRASTRUCTURE
UPDATE application_groups ag
SET group_type = 'INFRASTRUCTURE'
WHERE EXISTS (
  SELECT 1 FROM applications a
  WHERE a.group_id = ag.id AND a.application_type = 'SYSTEM' AND a.deleted_at IS NULL
);

-- Nhóm đã có SystemSoftware → INFRASTRUCTURE
UPDATE application_groups ag
SET group_type = 'INFRASTRUCTURE'
WHERE EXISTS (
  SELECT 1 FROM system_software ss
  WHERE ss.group_id = ag.id AND ss.deleted_at IS NULL
);

-- Còn lại → BUSINESS (đã là default, không cần update)
```

### 2.2 Hợp nhất `SystemSoftware` → `Application`

**Lý do hợp nhất:**
- `ServerOsInstall.application_id` đã tham chiếu `Application` → OS catalog đúng vị trí là `Application`
- Hai bảng phục vụ cùng mục đích nhưng có cấu trúc khác nhau gây nhầm lẫn
- Sau khi hợp nhất, toàn bộ phần mềm hạ tầng (OS, DB, Middleware...) đều trong `Application(type=SYSTEM)`

**Thêm field vào `Application` để đủ thông tin của `SystemSoftware`:**
```prisma
model Application {
  // ... fields hiện có ...
  eol_date  DateTime?           // THÊM MỚI — End of Life date
  vendor    String?  @db.VarChar(255)  // THÊM MỚI — nhà cung cấp phần mềm
}
```

**Data migration:** Copy từng record `SystemSoftware` → `Application`:
```
SystemSoftware.name       → Application.name
SystemSoftware.version    → Application.version
SystemSoftware.sw_type    → Application.sw_type
SystemSoftware.eol_date   → Application.eol_date  (field mới)
SystemSoftware.group_id   → Application.group_id  (giữ nguyên)
AUTO: application_type    = 'SYSTEM'
AUTO: code                = 'SW_' + normalize(name)  // xem hàm normalize bên dưới
AUTO: vendor              = NULL  (SystemSoftware không có field này)
```

**Hàm normalize code:**
```typescript
function normalizeCode(name: string): string {
  return name.toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}
// "Ubuntu Server 22.04 LTS" → "SW_UBUNTU_SERVER_22_04_LTS"
// "PostgreSQL 15"           → "SW_POSTGRESQL_15"
```

**Xử lý trùng code:** Nếu `code` đã tồn tại trong `Application`, append `_V2`, `_V3`...

**Thời điểm drop bảng `system_software`:** Sprint 17 (sau khi verify dữ liệu migration ổn định). Sprint 16 chỉ migrate data và refactor endpoint.

### 2.3 Refactor endpoint `/system-software`

`SystemSoftwareController` và `SystemSoftwareService` sẽ được refactor để **delegate hoàn toàn sang `ApplicationService`** với filter `application_type = SYSTEM`. Không xóa route `/api/v1/system-software` để backward compatible với sprint hiện tại.

**Mapping request → ApplicationService:**
```
GET  /system-software?search=X&sw_type=Y&group_id=Z
  → applicationService.list({ application_type: 'SYSTEM', search: X, sw_type: Y, group_id: Z })

POST /system-software { name, version, sw_type, group_id, eol_date, vendor }
  → applicationService.create({ application_type: 'SYSTEM', code: autoGenerate(name), ... })

PATCH /system-software/:id { name, version, sw_type, eol_date, vendor }
  → applicationService.update(id, dto)

DELETE /system-software/:id
  → applicationService.remove(id)
```

---

## 3. Phân tích tác động chi tiết

### 3.1 Backend — thay đổi từng file

#### `prisma/schema.prisma`

```prisma
// THÊM enum
enum GroupType {
  BUSINESS
  INFRASTRUCTURE
}

// THÊM field vào ApplicationGroup
model ApplicationGroup {
  id          String    @id @default(uuid()) @db.Uuid
  code        String    @unique @db.VarChar(50)
  name        String    @db.VarChar(255)
  description String?   @db.Text
  group_type  GroupType @default(BUSINESS)      // THÊM
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  applications    Application[]
  system_software SystemSoftware[]   // Giữ tới khi drop bảng ở sprint 17

  @@map("application_groups")
}

// THÊM 2 field vào Application
model Application {
  // ... tất cả field hiện có ...
  eol_date  DateTime?             // THÊM
  vendor    String?  @db.VarChar(255)  // THÊM
  // ... relations hiện có ...
}
```

#### Migrations (thứ tự bắt buộc)

1. `20260424_add_group_type_to_application_groups` — thêm enum + field + data migration SQL
2. `20260424_add_eol_vendor_to_applications` — thêm `eol_date`, `vendor` vào `applications`
3. `20260424_migrate_system_software_to_applications` — copy data từ `system_software` → `applications`

> **Lưu ý:** Migration 3 chạy Prisma `executeRaw` để INSERT từ SELECT. Cần test trên bản sao DB trước.

#### `app-group/dto/create-app-group.dto.ts`

```typescript
// THÊM field
@ApiProperty({ enum: ['BUSINESS', 'INFRASTRUCTURE'], example: 'BUSINESS' })
@IsNotEmpty()
@IsEnum(['BUSINESS', 'INFRASTRUCTURE'])
group_type: 'BUSINESS' | 'INFRASTRUCTURE';
```

#### `app-group/dto/query-app-group.dto.ts`

```typescript
// THÊM filter
@ApiPropertyOptional({ enum: ['BUSINESS', 'INFRASTRUCTURE'] })
@IsOptional()
@IsEnum(['BUSINESS', 'INFRASTRUCTURE'])
group_type?: 'BUSINESS' | 'INFRASTRUCTURE';
```

#### `app-group/app-group.service.ts`

Thêm filter trong `list()`:
```typescript
if (query.group_type) where.group_type = query.group_type;
```

Sửa `_count` sau khi drop `system_software` (sprint 17). Hiện tại giữ nguyên.

#### `application/dto/create-application.dto.ts`

```typescript
// THÊM 2 field
@ApiPropertyOptional()
@IsOptional()
@IsDateString()
eol_date?: string;

@ApiPropertyOptional({ example: 'Microsoft' })
@IsOptional()
@IsString()
@MaxLength(255)
vendor?: string;
```

#### `application/dto/query-application.dto.ts`

```typescript
// THÊM filter
@ApiPropertyOptional({ enum: ['BUSINESS', 'INFRASTRUCTURE'] })
@IsOptional()
@IsString()
group_type?: string;   // filter theo group.group_type
```

#### `application/application.service.ts`

**Thêm validate trong `create()` và `update()`:**
```typescript
// Sau khi tìm group:
const group = await this.prisma.applicationGroup.findFirst({
  where: { id: dto.group_id, deleted_at: null },
});
if (!group) throw new NotFoundException(`AppGroup ${dto.group_id} not found`);

// Validate group_type vs application_type
if (dto.application_type === 'BUSINESS' && group.group_type !== 'BUSINESS') {
  throw new ConflictException(
    `Ứng dụng nghiệp vụ (BUSINESS) phải thuộc nhóm loại BUSINESS. Nhóm "${group.name}" có loại INFRASTRUCTURE.`
  );
}
if (dto.application_type === 'SYSTEM' && group.group_type !== 'INFRASTRUCTURE') {
  throw new ConflictException(
    `Phần mềm hạ tầng (SYSTEM) phải thuộc nhóm loại INFRASTRUCTURE. Nhóm "${group.name}" có loại BUSINESS.`
  );
}
```

**Thêm filter `group_type` trong `list()`:**
```typescript
if (query.group_type) {
  where.group = { group_type: query.group_type };
}
```

**Thêm `eol_date`, `vendor` vào `create()` và `update()`:**
```typescript
// create data:
{
  ...dto,
  eol_date: dto.eol_date ? new Date(dto.eol_date) : undefined,
}
```

#### `system-software/system-software.service.ts`

Toàn bộ methods delegate sang `ApplicationService`. Inject `ApplicationService` thay vì dùng `PrismaService` trực tiếp.

```typescript
// Trước:
async list(query: QuerySystemSoftwareDto) {
  return this.prisma.systemSoftware.findMany(...)
}

// Sau:
async list(query: QuerySystemSoftwareDto) {
  return this.applicationService.list({
    ...query,
    application_type: 'SYSTEM',
  });
}

async create(dto: CreateSystemSoftwareDto) {
  const code = 'SW_' + dto.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 40);
  return this.applicationService.create({
    ...dto,
    application_type: 'SYSTEM',
    code,
  });
}
```

#### `import/import.service.ts`

Khi auto-create group `OS`:
```typescript
// TRƯỚC:
group = await this.prisma.applicationGroup.create({
  data: { code: 'OS', name: 'Operating Systems' },
});

// SAU:
group = await this.prisma.applicationGroup.create({
  data: { code: 'OS', name: 'Operating Systems', group_type: 'INFRASTRUCTURE' },
});
```

Tương tự với group `DEFAULT` cho application import:
```typescript
group = await this.prisma.applicationGroup.create({
  data: { code: groupCode, name: groupCode, group_type: 'BUSINESS' },
});
```

---

### 3.2 Frontend — thay đổi từng file

#### `types/application.ts`

```typescript
// THÊM type mới
export type GroupType = 'BUSINESS' | 'INFRASTRUCTURE';

// SỬA ApplicationGroup — thêm group_type
export interface ApplicationGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  group_type: GroupType;          // THÊM
  created_at: string;
  updated_at: string;
  _count?: {
    applications: number;
    system_software: number;      // Giữ tới sprint 17
  };
}

// SỬA Application — thêm các field đang thiếu
export interface Application {
  id: string;
  group_id: string;
  code: string;
  name: string;
  description?: string;
  version?: string;
  owner_team?: string;
  application_type: 'BUSINESS' | 'SYSTEM';  // THÊM (đang thiếu)
  sw_type?: SoftwareType;                    // THÊM (đang thiếu)
  eol_date?: string;                         // THÊM
  vendor?: string;                           // THÊM
  status?: AppStatus;
  tech_stack?: string;
  repo_url?: string;
  created_at: string;
  updated_at: string;
  group?: ApplicationGroup;
}
```

> **Lưu ý quan trọng:** Interface `Application` hiện tại **đang thiếu** `application_type` và `sw_type` — hai field này tồn tại trong backend response nhưng không có trong type frontend. Cần thêm đồng thời với sprint này.

#### `hooks/useAppGroups.ts`

```typescript
// SỬA AppGroupParams — thêm group_type
export interface AppGroupParams {
  page?: number;
  limit?: number;
  search?: string;
  group_type?: GroupType;   // THÊM
}
```

#### `hooks/useApplications.ts`

```typescript
// SỬA ApplicationParams — thêm các filter mới
export interface ApplicationParams {
  page?: number;
  limit?: number;
  search?: string;
  group_id?: string;
  status?: string;
  environment?: string;
  application_type?: 'BUSINESS' | 'SYSTEM';   // ĐÃ CÓ nhưng cần đảm bảo typed
  sw_type?: string;
  group_type?: GroupType;   // THÊM — filter gián tiếp qua group
}
```

#### `pages/application/components/ApplicationForm.tsx`

Thay đổi quan trọng:

1. **Thêm field `application_type`** (Select: BUSINESS / SYSTEM) — hiển thị khi tạo mới, disabled khi edit
2. **Thêm field `sw_type`** — chỉ hiển thị khi `application_type === 'SYSTEM'`
3. **Thêm field `eol_date`** (DatePicker) — chỉ hiển thị khi `application_type === 'SYSTEM'`
4. **Thêm field `vendor`** — chỉ hiển thị khi `application_type === 'SYSTEM'`
5. **Dropdown nhóm lọc theo `application_type`:**

```typescript
// Lấy groups đã filter theo group_type
const appType = Form.useWatch('application_type', form);
const groupType = appType === 'SYSTEM' ? 'INFRASTRUCTURE' : 'BUSINESS';

const { data: groups } = useAppGroupList({
  limit: 100,
  group_type: groupType,   // Tự động lọc khi application_type thay đổi
});

// Khi application_type thay đổi → reset group_id để tránh lưu nhóm sai type
const handleAppTypeChange = () => {
  form.setFieldValue('group_id', undefined);
};
```

6. **Hỗ trợ truyền `initialType` từ parent** (tab Nghiệp vụ → pre-fill `BUSINESS`, tab Hạ tầng → pre-fill `SYSTEM`)

#### `pages/application/components/AppGroupList.tsx`

1. **Hiển thị badge `group_type`:**
```typescript
{
  title: 'Loại nhóm',
  dataIndex: 'group_type',
  key: 'group_type',
  width: 140,
  render: (type: GroupType) => (
    <Tag color={type === 'BUSINESS' ? 'blue' : 'orange'}>
      {type === 'BUSINESS' ? 'Nghiệp vụ' : 'Hạ tầng'}
    </Tag>
  ),
}
```

2. **Thêm filter dropdown** `group_type` (Tất cả / Nghiệp vụ / Hạ tầng) truyền vào `useAppGroupList`

3. **Form tạo/sửa nhóm** (trong `AppGroupModal.tsx`): thêm Select `group_type` required

#### `pages/application/components/AppGroupModal.tsx`

```typescript
// THÊM field trong Form
<Form.Item
  name="group_type"
  label="Loại nhóm"
  rules={[{ required: true, message: 'Vui lòng chọn loại nhóm' }]}
>
  <Select
    options={[
      { value: 'BUSINESS', label: 'Nghiệp vụ (Business)' },
      { value: 'INFRASTRUCTURE', label: 'Hạ tầng (Infrastructure)' },
    ]}
    disabled={!!editGroup}  // Không cho đổi loại sau khi đã tạo
  />
</Form.Item>
```

> **Lý do disable khi edit:** Đổi `group_type` của nhóm đang có apps sẽ vi phạm constraint. Nếu cần đổi, phải chuyển apps sang nhóm khác trước.

#### `pages/application/index.tsx`

Tái cấu trúc 2 tab ứng dụng:

```
Tabs:
  ├── "Nghiệp vụ"  → useApplicationList({ application_type: 'BUSINESS' })
  │     Columns: Mã, Tên, Nhóm, Version, Owner Team, Thao tác
  │     Button "Thêm": mở ApplicationForm với initialType='BUSINESS'
  │
  ├── "Hạ tầng"    → useApplicationList({ application_type: 'SYSTEM' })
  │     Columns: Mã, Tên, Nhóm, Loại (sw_type), Vendor, EOL Date, Thao tác
  │     Button "Thêm": mở ApplicationForm với initialType='SYSTEM'
  │     (Thay thế nội dung của SystemSoftwarePage)
  │
  └── "Nhóm"       → AppGroupList (giữ như hiện tại, thêm badge group_type)
```

#### `pages/application/SystemSoftwarePage.tsx`

Route `/system-software` → redirect sang `/applications` (tab Hạ tầng):

```typescript
// App.tsx — đổi route
<Route path="/system-software" element={<Navigate to="/applications?tab=infra" replace />} />
```

Trang `SystemSoftwarePage.tsx` có thể giữ lại nhưng bên trong redirect, hoặc xóa hẳn component và chỉ giữ route redirect.

---

## 4. Luồng data sau khi hoàn thành sprint 16

```
ApplicationGroup (có group_type: BUSINESS | INFRASTRUCTURE)
  ├── [BUSINESS groups]
  │     └── Application (application_type = BUSINESS)
  │           ├── AppDeployment
  │           ├── AppConnection
  │           └── Port
  │
  └── [INFRASTRUCTURE groups]
        └── Application (application_type = SYSTEM, sw_type = OS | MIDDLEWARE | ...)
              ├── AppDeployment    (Middleware/DB deploy lên server)
              ├── ServerOsInstall  (OS install history)
              └── eol_date, vendor (từ SystemSoftware migrate sang)

[Bảng system_software] → deprecated, sẽ drop ở sprint 17
[Route /system-software] → redirect sang /applications?tab=infra
```

---

## 5. Task List

### S16-01 — Schema: thêm GroupType enum + group_type field vào ApplicationGroup
- **Loại:** Backend — DB Migration
- **Effort:** 2 SP
- **Files:**
  - `packages/backend/prisma/schema.prisma` — thêm enum `GroupType`, thêm field `group_type GroupType @default(BUSINESS)` vào model `ApplicationGroup`
  - Tạo migration `add_group_type_to_application_groups`
- **Data migration trong cùng migration file** (Prisma `$executeRaw`):
  ```sql
  -- Set INFRASTRUCTURE cho nhóm có Application(type=SYSTEM)
  UPDATE application_groups SET group_type = 'INFRASTRUCTURE'
  WHERE id IN (
    SELECT DISTINCT group_id FROM applications
    WHERE application_type = 'SYSTEM' AND deleted_at IS NULL
  );
  -- Set INFRASTRUCTURE cho nhóm có SystemSoftware
  UPDATE application_groups SET group_type = 'INFRASTRUCTURE'
  WHERE id IN (
    SELECT DISTINCT group_id FROM system_software WHERE deleted_at IS NULL
  );
  ```
- **Verify:** `SELECT group_type, COUNT(*) FROM application_groups GROUP BY group_type;`
- **Dependency:** —

### S16-02 — Schema: thêm eol_date, vendor vào Application
- **Loại:** Backend — DB Migration
- **Effort:** 1 SP
- **Files:**
  - `packages/backend/prisma/schema.prisma` — thêm `eol_date DateTime?` và `vendor String? @db.VarChar(255)` vào model `Application`
  - Tạo migration `add_eol_vendor_to_applications`
- **Dependency:** —

### S16-03 — Data migration: SystemSoftware → Application
- **Loại:** Backend — DB Migration + Script
- **Effort:** 3 SP
- **Files:**
  - Tạo Prisma migration `migrate_system_software_to_applications` với `$executeRaw`:
  ```sql
  INSERT INTO applications (id, group_id, code, name, version, sw_type, eol_date, application_type, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    group_id,
    'SW_' || UPPER(REGEXP_REPLACE(name, '[^A-Z0-9a-z]', '_', 'g')),
    name,
    version,
    sw_type::text::"SwType",
    eol_date,
    'SYSTEM'::"ApplicationType",
    created_at,
    NOW()
  FROM system_software
  WHERE deleted_at IS NULL
  ON CONFLICT (code) DO NOTHING;  -- Skip nếu code đã tồn tại
  ```
- **Lưu ý:** Record đã có trong `Application(type=SYSTEM)` từ import không bị ảnh hưởng (conflict skip)
- **KHÔNG drop bảng `system_software` trong sprint này** — để sprint 17
- **Verify:** `SELECT COUNT(*) FROM applications WHERE application_type = 'SYSTEM';` so sánh với `SELECT COUNT(*) FROM system_software WHERE deleted_at IS NULL;`
- **Dependency:** S16-01, S16-02

### S16-04 — Backend: AppGroup DTO & Service cập nhật
- **Loại:** Backend — API
- **Effort:** 2 SP
- **Files:**
  - `packages/backend/src/modules/app-group/dto/create-app-group.dto.ts` — thêm `group_type` required
  - `packages/backend/src/modules/app-group/dto/query-app-group.dto.ts` — thêm `group_type` optional filter
  - `packages/backend/src/modules/app-group/app-group.service.ts`:
    - `list()`: thêm `if (query.group_type) where.group_type = query.group_type;`
    - `create()`: field `group_type` đã có trong DTO, Prisma tự nhận
- **Response thay đổi:** `_count` giữ nguyên có `system_software` (sprint 17 mới bỏ)
- **Dependency:** S16-01

### S16-05 — Backend: Application DTO & Service cập nhật
- **Loại:** Backend — API
- **Effort:** 3 SP
- **Files:**
  - `packages/backend/src/modules/application/dto/create-application.dto.ts` — thêm `eol_date?`, `vendor?`
  - `packages/backend/src/modules/application/dto/query-application.dto.ts` — thêm `group_type?` filter
  - `packages/backend/src/modules/application/application.service.ts`:
    - `create()`: validate `group.group_type` khớp `application_type` (xem logic ở mục 3.1)
    - `update()`: validate tương tự nếu `dto.group_id` thay đổi
    - `list()`: thêm filter `group_type` → `where.group = { group_type: ... }`
    - `create()` / `update()`: handle `eol_date: dto.eol_date ? new Date(dto.eol_date) : undefined`
- **Error message rõ ràng** (tiếng Việt): "Ứng dụng nghiệp vụ phải thuộc nhóm loại BUSINESS"
- **Dependency:** S16-01, S16-02

### S16-06 — Backend: SystemSoftware endpoint refactor → delegate sang ApplicationService
- **Loại:** Backend — API
- **Effort:** 2 SP
- **Files:**
  - `packages/backend/src/modules/application/system-software.service.ts` — toàn bộ method delegate sang `ApplicationService`
  - `packages/backend/src/modules/application/system-software.controller.ts` — giữ nguyên route, inject `ApplicationService`
  - `packages/backend/src/modules/application/application.module.ts` — đảm bảo export `ApplicationService`
- **Auto-generate code khi POST `/system-software`:**
  ```typescript
  const code = 'SW_' + dto.name.toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
  ```
- **Không thay đổi response shape** — `/system-software` vẫn trả về cùng structure như cũ (dùng Application data)
- **Dependency:** S16-03, S16-05

### S16-07 — Frontend: Types & Hooks cập nhật
- **Loại:** Frontend — Types/Hooks
- **Effort:** 1 SP
- **Files:**
  - `packages/frontend/src/types/application.ts`:
    - Thêm `export type GroupType = 'BUSINESS' | 'INFRASTRUCTURE'`
    - Sửa `ApplicationGroup`: thêm `group_type: GroupType`
    - Sửa `Application`: thêm `application_type: 'BUSINESS' | 'SYSTEM'`, `sw_type?: SoftwareType`, `eol_date?: string`, `vendor?: string`
  - `packages/frontend/src/hooks/useAppGroups.ts`:
    - Sửa `AppGroupParams`: thêm `group_type?: GroupType`
  - `packages/frontend/src/hooks/useApplications.ts`:
    - Sửa `ApplicationParams`: thêm `group_type?: GroupType`; đảm bảo `application_type` typed là `'BUSINESS' | 'SYSTEM'`
- **Dependency:** —

### S16-08 — Frontend: AppGroupModal — thêm field group_type
- **Loại:** Frontend — UI
- **Effort:** 1 SP
- **Files:**
  - `packages/frontend/src/pages/application/components/AppGroupModal.tsx`:
    - Thêm `Form.Item` cho `group_type` (Select: Nghiệp vụ / Hạ tầng, required)
    - `disabled={!!editGroup}` để không đổi loại khi edit
    - Tooltip giải thích: "Loại nhóm không thể thay đổi sau khi tạo"
- **Dependency:** S16-07

### S16-09 — Frontend: AppGroupList — hiển thị badge group_type, thêm filter
- **Loại:** Frontend — UI
- **Effort:** 2 SP
- **Files:**
  - `packages/frontend/src/pages/application/components/AppGroupList.tsx`:
    - Thêm cột `Loại nhóm` với Tag màu (`BUSINESS` → blue, `INFRASTRUCTURE` → orange)
    - Thêm filter Select "Loại nhóm" → truyền `group_type` vào `useAppGroupList`
    - Sửa `_count` display: hiển thị số `applications` (bỏ `system_software` count khỏi UI vì sẽ bị deprecated)
- **Dependency:** S16-07, S16-08

### S16-10 — Frontend: ApplicationForm — lọc nhóm theo context, thêm SYSTEM fields
- **Loại:** Frontend — UI
- **Effort:** 3 SP
- **Files:**
  - `packages/frontend/src/pages/application/components/ApplicationForm.tsx`:
    - Thêm prop `initialType?: 'BUSINESS' | 'SYSTEM'` (parent truyền vào)
    - Thêm `Form.Item` cho `application_type` (Select, required, disabled khi edit)
    - Dropdown nhóm: dùng `Form.useWatch('application_type', form)` để lấy type → truyền `group_type` vào `useAppGroupList`
    - `onValuesChange`: khi `application_type` thay đổi → reset `group_id` và `sw_type`
    - Thêm các field chỉ hiển thị khi `application_type === 'SYSTEM'`:
      - `sw_type` (Select: OS / MIDDLEWARE / DATABASE / RUNTIME / WEB_SERVER / OTHER)
      - `vendor` (Input text)
      - `eol_date` (DatePicker)
    - Ẩn `tech_stack`, `repo_url` khi `application_type === 'SYSTEM'` (không liên quan đến infra software)
- **Dependency:** S16-07, S16-09

### S16-11 — Frontend: Application page — tái cấu trúc tabs Nghiệp vụ / Hạ tầng
- **Loại:** Frontend — UI
- **Effort:** 3 SP
- **Files:**
  - `packages/frontend/src/pages/application/index.tsx`:
    - Thêm state `activeAppType: 'BUSINESS' | 'SYSTEM'` (theo dõi tab đang chọn)
    - Tab "Nghiệp vụ": `useApplicationList({ application_type: 'BUSINESS', ... })`; columns: Mã, Tên, Nhóm, Version, Owner Team
    - Tab "Hạ tầng": `useApplicationList({ application_type: 'SYSTEM', ... })`; columns: Mã, Tên, Nhóm, Loại (sw_type), Vendor, EOL Date
    - Button "Thêm ứng dụng" → `setFormOpen(true)` với `initialType = activeAppType`
    - Xóa tab "System Software" riêng nếu đang có; nội dung đã merged vào tab Hạ tầng
    - Hỗ trợ URL query param `?tab=infra` để `/system-software` redirect đến đúng tab
- **Dependency:** S16-10

### S16-12 — Frontend: SystemSoftware page → redirect
- **Loại:** Frontend — UI/Routing
- **Effort:** 1 SP
- **Files:**
  - `packages/frontend/src/App.tsx`:
    ```tsx
    <Route path="/system-software" element={<Navigate to="/applications?tab=infra" replace />} />
    ```
  - Xóa import `SystemSoftwarePage` nếu component không còn dùng ở chỗ nào khác
  - Cập nhật Sidebar: link "System Software" → đổi thành link `/applications?tab=infra` với label "Phần mềm hạ tầng", hoặc ẩn hẳn item trong sidebar và gộp vào menu "Ứng dụng"
- **Dependency:** S16-11

### S16-13 — Backend: Import service cập nhật group_type
- **Loại:** Backend — Import
- **Effort:** 1 SP
- **Files:**
  - `packages/backend/src/modules/import/import.service.ts`:
    - Tìm các chỗ `applicationGroup.create` hoặc `upsert` → thêm `group_type: 'INFRASTRUCTURE'` cho group "OS"
    - Tìm các chỗ tạo group mặc định cho application import → thêm `group_type: 'BUSINESS'`
    - Tìm upsert group trong `importServer()` → thêm `group_type` vào cả `create` và `update`
- **Dependency:** S16-04

---

## 6. Tổng hợp task

| ID | Tên task | Effort | Loại | Dependency |
|----|----------|--------|------|------------|
| S16-01 | Schema: GroupType enum + group_type | 2 SP | DB | — |
| S16-02 | Schema: eol_date, vendor vào Application | 1 SP | DB | — |
| S16-03 | Data migration: SystemSoftware → Application | 3 SP | DB | S16-01, S16-02 |
| S16-04 | AppGroup DTO & Service | 2 SP | Backend | S16-01 |
| S16-05 | Application DTO & Service | 3 SP | Backend | S16-01, S16-02 |
| S16-06 | SystemSoftware endpoint delegate | 2 SP | Backend | S16-03, S16-05 |
| S16-07 | Frontend Types & Hooks | 1 SP | Frontend | — |
| S16-08 | AppGroupModal — thêm group_type | 1 SP | Frontend | S16-07 |
| S16-09 | AppGroupList — badge + filter | 2 SP | Frontend | S16-07, S16-08 |
| S16-10 | ApplicationForm — context-aware | 3 SP | Frontend | S16-07, S16-09 |
| S16-11 | Application page — tabs Nghiệp vụ / Hạ tầng | 3 SP | Frontend | S16-10 |
| S16-12 | SystemSoftware page → redirect | 1 SP | Frontend | S16-11 |
| S16-13 | Import service: group_type đúng context | 1 SP | Backend | S16-04 |
| **Tổng** | | **25 SP** | | |

---

## 7. Dependency graph & thứ tự triển khai

```
[Có thể start song song ngay:]
  S16-01 ──────────────────────┐
  S16-02 ────────────────────┐ │
  S16-07 ──┬──> S16-08 ──┐  │ │
            └──> (S16-09) │  │ │
                          │  │ │
[Sau khi S16-01, S16-02 done:]  │ │
  S16-03 (cần S16-01+S16-02) ──┘ │
  S16-04 (cần S16-01) ────────────┘ ──> S16-13
  S16-05 (cần S16-01+S16-02) ──────────────┐
                                           │
[Sau khi S16-03, S16-05 done:]             │
  S16-06 (cần S16-03+S16-05) ◄────────────┘

[Frontend chain (chạy song song với backend sau S16-07):]
  S16-07 → S16-08 → S16-09 → S16-10 → S16-11 → S16-12
  (S16-10 cũng cần S16-05 cho validation rule)
```

**Khuyến nghị thứ tự thực tế:**
1. **Ngày 1:** S16-01 + S16-02 + S16-07 (song song)
2. **Ngày 2:** S16-03 + S16-04 + S16-08 (song song)
3. **Ngày 3:** S16-05 + S16-09 + S16-13 (song song)
4. **Ngày 4:** S16-06 + S16-10
5. **Ngày 5:** S16-11 + S16-12 + test toàn bộ

---

## 8. Validation rules tổng hợp

| Rule | Enforce ở đâu | Error khi vi phạm |
|------|--------------|-------------------|
| BUSINESS app → BUSINESS group | `ApplicationService.create()` + `update()` | 409 Conflict "Ứng dụng nghiệp vụ phải thuộc nhóm loại BUSINESS" |
| SYSTEM app → INFRASTRUCTURE group | `ApplicationService.create()` + `update()` | 409 Conflict "Phần mềm hạ tầng phải thuộc nhóm loại INFRASTRUCTURE" |
| SYSTEM app → phải có `sw_type` | `CreateApplicationDto` validator | 400 Bad Request |
| group_type không đổi sau khi tạo | Frontend: disable Select khi edit; Backend: không có special logic (field vẫn update-able, nhưng UI chặn) | UI warning tooltip |
| Import auto-create group → đúng type | `ImportService.importServer()` | — (internal, không expose) |

---

## 9. Rủi ro & Xử lý

| Rủi ro | Khả năng | Xử lý |
|--------|---------|-------|
| Group hiện tại có cả BUSINESS và SYSTEM apps | Thấp | Migration S16-01 ưu tiên INFRASTRUCTURE; cần verify sau migration |
| Code trùng khi migrate `SystemSoftware` → `Application` | Trung bình | `ON CONFLICT DO NOTHING` trong SQL; log các record bị skip |
| Frontend gọi `/system-software` trực tiếp ở chỗ khác | Trung bình | Search toàn bộ `frontend/src` với keyword `/system-software` trước khi redirect |
| `ServerOsInstall.application_id` trỏ đến Application đã migrate | Không xảy ra | Record OS trong Application không bị thay đổi, chỉ SystemSoftware mới migrate |

---

## 10. Điểm cần chốt trước khi code

1. **Có bắt buộc `sw_type` khi tạo SYSTEM application?**  
   → Gợi ý: Có — bắt buộc để dữ liệu có ý nghĩa. Validation trong DTO.

2. **Sidebar navigation:** Gộp "System Software" vào menu "Ứng dụng" hay giữ entry riêng?  
   → Gợi ý: Giữ entry "Phần mềm hạ tầng" riêng trong sidebar nhưng link đến `/applications?tab=infra`.

3. **`group_type` có cho phép đổi sau khi tạo không?**  
   → Gợi ý: Không cho đổi qua UI. Backend vẫn cho update (không có hard constraint ở DB) nhưng UI disable field.

4. **`OsLifecycleTab` trong Server Detail** đang dùng `/applications?application_type=SYSTEM&sw_type=OS` để load dropdown — sau sprint này vẫn hoạt động đúng không?  
   → Có, vì Application(type=SYSTEM, sw_type=OS) vẫn là cùng endpoint, không thay đổi.
