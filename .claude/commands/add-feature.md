# Add Feature — End-to-End Delivery Pipeline

Nhận một yêu cầu tính năng mới, đọc kế hoạch sprint hiện tại, cập nhật tài liệu, implement, test và push branch — đảm bảo docs/code/tracking luôn đồng bộ.

## Input
- Feature description: $ARGUMENTS (e.g., "thêm chức năng export PDF báo cáo deployment")

---

## CRITICAL — Quy tắc bất biến (KHÔNG vi phạm)

- **KHÔNG XÓA** nội dung lịch sử trong bất kỳ file tài liệu nào.
- **KHÔNG OVERWRITE** PROGRESS_LOG.md — luôn **prepend** entry mới vào đầu file.
- `@IsIn(['VAL1','VAL2'] as const)` — KHÔNG `@IsEnum(PrismaEnum)`.
- `@Roles('ADMIN')` string literal — KHÔNG `@Roles(Role.ADMIN)`.
- **KHÔNG commit** `.env`, secrets, `node_modules`.
- Đọc file trước khi edit — nếu file trông bị corrupt → restore trước.

---

## Phase 0 — Bootstrap (đọc toàn bộ context trước khi làm bất cứ điều gì)

### 0.1 Đọc project rules & trạng thái

```
CLAUDE.md                    — conventions, module rules, security, git strategy
TASKS.md                     — xác định sprint đang hoạt động, tasks còn ⬜/🔄
deployment-status.json       — current_sprint, overall_pct, module status
docs/PROGRESS_LOG.md         — lịch sử thay đổi gần nhất (3–5 entries đầu)
docs/SRS.md                  — phần liên quan đến $ARGUMENTS
docs/IMPLEMENTATION_DETAILS.md — quyết định kỹ thuật đã có để tránh duplicate
```

### 0.2 Xác định Sprint hiện tại

Từ `TASKS.md` hoặc `deployment-status.json`, xác định:
- **Sprint number**: `<NN>`
- **Sprint goal**: tên sprint
- **Capacity còn lại**: ước tính story points còn chỗ hay không (so sánh tasks ⬜ vs ✅)

### 0.3 Tìm và đọc Sprint Plan (QUAN TRỌNG)

```bash
# Tìm file kế hoạch của sprint hiện tại
ls docs/plans/sprint-<NN>-*.md 2>/dev/null

# Nếu không tìm theo số sprint, thử tìm file hiện hành
ls docs/plans/*.md 2>/dev/null | grep -v archived
```

**Kết quả — 2 trường hợp:**

#### Trường hợp A — Tìm thấy file plan (`docs/plans/sprint-<NN>-<slug>.md` hoặc tương đương)

Đọc toàn bộ file plan đó. Trích xuất:
- Danh sách tasks đã có (tránh duplicate khi thêm task mới)
- Files dự kiến thay đổi (tránh conflict)
- Scope hiện tại của sprint (để đánh giá tính năng mới có fit không)
- Quyết định kỹ thuật đã ghi trong plan

→ **Tiếp tục Phase 1** với context từ sprint plan.

#### Trường hợp B — KHÔNG tìm thấy file plan

Sprint chưa có tài liệu kế hoạch. Thực hiện theo thứ tự:

1. **Chạy `/update-docs`** với argument: `"đầu sprint <NN> — chuẩn bị kế hoạch cho sprint mới, mục tiêu: <sprint goal lấy từ TASKS.md>"`

   > Lệnh này sẽ tạo file `docs/plans/sprint-<NN>-<slug>.md` và cập nhật PROGRESS_LOG, deployment-status.

2. **Đọc file plan vừa được tạo** bởi `/update-docs`.

3. **Tiếp tục Phase 1** với file plan mới làm base context.

### 0.4 Kiểm tra linter (trước khi edit bất kỳ file code nào)

- `packages/backend/src/prisma/prisma.service.ts` phải có `extends PrismaClient` (không phải mock).
- DTOs không có `@IsEnum(...)` — nếu thấy → note lại, fix khi chạm file đó.
- Decorators dùng string literal.

---

## Phase 1 — Phân tích Yêu cầu & Định vị trong Sprint

### 1.1 Phân tích $ARGUMENTS

Xác định:
- **Tên tính năng**: ngắn gọn, rõ ràng
- **Module liên quan**: BE module và/hoặc FE page nào bị ảnh hưởng
- **Loại thay đổi**: `[BE]` / `[FE]` / `[INT]` hoặc tổ hợp
- **Story points**: 1 / 2 / 3 / 5 / 8
- **Dependencies**: task hoặc tính năng nào phải có trước

### 1.2 Đối chiếu với Sprint Plan hiện tại

So sánh yêu cầu mới với nội dung sprint plan đã đọc ở Phase 0.3:

| Câu hỏi | Trả lời |
|---------|---------|
| Tính năng này có overlap với task nào trong plan không? | <task ID hoặc "Không"> |
| File nào đã được plan dự kiến thay đổi mà feature này cũng cần? | <list hoặc "Không có"> |
| Sprint còn đủ capacity không (< 80% points đã phân bổ)? | <Có / Không — nếu Không → cân nhắc sprint mới> |
| Feature này có phù hợp với sprint goal hiện tại không? | <Có / Không + lý do> |

**Nếu sprint đầy hoặc feature không fit sprint goal hiện tại:**
- Ghi nhận vào Backlog trong `TASKS.md`
- Báo cho user và dừng tại đây (không implement)

### 1.3 Quyết định kỹ thuật

Dựa trên sprint plan + IMPLEMENTATION_DETAILS.md, xác định approach:
- Có thể tái dùng pattern/component nào đã có?
- Thay đổi nào có risk cao (schema migration, breaking API)?
- Files cụ thể sẽ tạo mới / sửa

---

## Phase 2 — Cập nhật Tài liệu

### 2.1 Cập nhật `docs/SRS.md`

Tìm section phù hợp, **append** section mới — KHÔNG xóa nội dung cũ:

```markdown
### <section>.<N+1> <Tên tính năng>
**Mô tả:** <mô tả ngắn>
**Actor:** <ADMIN | OPERATOR | VIEWER>
**Acceptance Criteria:**
- AC1: <criterion>
- AC2: <criterion>
**Added:** <YYYY-MM-DD>
```

### 2.2 Cập nhật Sprint Plan (`docs/plans/sprint-<NN>-<slug>.md`)

**Append section mới vào cuối file** — KHÔNG xóa nội dung cũ:

```markdown
---

## <Số thứ tự>. [FE|BE|INT] <Tên tính năng> *(added <YYYY-MM-DD>)*

**Yêu cầu từ:** $ARGUMENTS
**Story points:** <N>

### Thành phần Backend (nếu có)
- **Cơ chế:** <giải thích kỹ thuật>
- **API endpoints mới:** `<METHOD> /api/v1/<path>`
- **Files thay đổi:**
  - `<path>` — <mô tả> (new|update)

### Thành phần Frontend (nếu có)
- **Trang/Component:** <mô tả UI>
- **Files thay đổi:**
  - `<path>` — <mô tả> (new|update)

### Tasks
| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S<NN>-<XX> | `[FE]` | <mô tả> | N |
```

### 2.3 Cập nhật `docs/IMPLEMENTATION_DETAILS.md`

Prepend entry kỹ thuật mới (sau header):

```markdown
## <Tên tính năng> (<YYYY-MM-DD>)

**Status:** 🔄 In Progress
**Context:** <vì sao cần, vấn đề đang giải quyết>
**Decision:** <cách tiếp cận đã chọn và lý do>
**Files impacted:**
- `<path/to/file>` — <mô tả thay đổi> (new|update)
**Trade-offs:** <các cân nhắc đánh đổi>
**Sprint plan ref:** `docs/plans/sprint-<NN>-<slug>.md`
```

### 2.4 Cập nhật `TASKS.md`

Thêm tasks vào sprint section phù hợp. Task ID tiếp nối số thứ tự hiện có:

```markdown
| S<NN>-<XX> | `[BE|FE|INT]` <mô tả task> | <points> | ⬜ |
```

Nếu tạo sprint mới (sprint đầy):

```markdown
## Sprint <NN+1> — <Sprint Goal> 🔄 IN PROGRESS

**Mục tiêu:** <goal>
**Thời gian:** <YYYY-MM-DD> → <YYYY-MM-DD + 7 ngày>
**Branch:** `sprint/<NN+1>`

| # | Task | Points | Status |
|---|------|--------|--------|
| S<NN+1>-01 | `[BE]` ... | N | ⬜ |
```

### 2.5 Prepend `docs/PROGRESS_LOG.md`

Thêm vào **ĐẦU file** (sau dòng `# PROGRESS LOG`):

```markdown
## <YYYY-MM-DD> — Sprint <NN>: Bắt đầu implement <tên tính năng>

- Yêu cầu ghi nhận vào SRS.md section <X.Y>
- Sprint plan cập nhật: `docs/plans/sprint-<NN>-<slug>.md`
- Kế hoạch kỹ thuật: `docs/IMPLEMENTATION_DETAILS.md`
- Tasks mới: S<NN>-<XX> đến S<NN>-<YY>
```

---

## Phase 3 — Tạo Branch

```bash
# Xác định base branch (sprint branch hoặc main)
git branch --show-current

# Tạo feat branch từ sprint branch
SPRINT_NUM=<NN>   # từ Phase 0.2
SLUG=<kebab-case> # ví dụ: export-pdf-deployment, topology-image-nodes
git checkout -b "feat/sprint-${SPRINT_NUM}-${SLUG}"
```

- `<slug>` = lowercase kebab-case tóm tắt tính năng.
- Nếu đã trên đúng feat branch → không tạo mới, tiếp tục.
- Base branch ưu tiên: `sprint/<NN>` → `main` (theo thứ tự).

---

## Phase 4 — Implement

> Implement theo thứ tự tasks trong Sprint Plan. Với mỗi task, đọc file đích trước khi edit.

### 4.1 Backend Tasks `[BE]`

Module structure chuẩn:
```
packages/backend/src/modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts        # @ApiOperation, @Roles, @RequireModule
├── <name>.service.ts           # business logic
├── dto/
│   ├── create-<name>.dto.ts   # @IsNotEmpty, @IsIn (KHÔNG @IsEnum)
│   ├── update-<name>.dto.ts   # PartialType(CreateDto)
│   └── query-<name>.dto.ts    # extends PaginationDto, all @IsOptional
├── entities/
│   └── <name>.entity.ts       # response shape, @ApiProperty
└── __tests__/
    └── <name>.service.spec.ts
```

**Rules:**
- `@IsIn(['VAL1','VAL2'] as const)` — KHÔNG `@IsEnum(PrismaEnum)`.
- Soft delete: `deleted_at` — KHÔNG hard delete.
- List query: luôn filter `deletedAt: null`.
- List response: `{ data: [...], meta: { total, page, limit } }`.
- Single response: `{ data: { ... } }`.
- Module mới → đăng ký trong `packages/backend/src/app.module.ts`.

Nếu cần migration Prisma:
```bash
cd packages/backend
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

### 4.2 Frontend Tasks `[FE]`

Structure chuẩn:
```
packages/frontend/src/pages/<module>/
├── index.tsx
├── [id].tsx                  (nếu cần)
├── components/
│   ├── <Name>List.tsx        # DataTable + server-side pagination
│   ├── <Name>Form.tsx        # React Hook Form + Zod
│   └── <Name>Filter.tsx
└── hooks/
    └── use<Name>.ts          # TanStack Query hooks
```

**Conventions:**
- Hooks: `use<Name>List`, `use<Name>Detail`, `useCreate<Name>`, `useUpdate<Name>`, `useDelete<Name>`.
- Sau mutation: `queryClient.invalidateQueries(['<name>'])`.
- Loading: Skeleton — KHÔNG Spinner.
- Delete: Popconfirm bắt buộc.
- Errors: `message.error(...)`.
- Route mới → `packages/frontend/src/App.tsx`.
- KHÔNG `console.log` — dùng `logger.*` từ `logger.ts`.

### 4.3 Integration / Test Tasks `[INT]`

- Unit tests: mock PrismaService, test service methods.
- E2E: Playwright cho critical flows.
- Naming: `describe('<MethodName>') → it('should <expected behavior>')`.

---

## Phase 5 — Verify & Fix

### 5.1 TypeScript check

```bash
cd packages/backend && npx tsc --noEmit 2>&1 | head -50
cd packages/frontend && npx tsc --noEmit 2>&1 | head -50
```

**Có lỗi TS → fix ngay, không bỏ qua, không tiếp tục.**

### 5.2 Build check

```bash
docker compose build backend 2>&1 | tail -30
docker compose up -d backend
```

Nếu fail:
1. Đọc log, fix TS errors.
2. Nếu Prisma client stale: `docker compose run --rm migrate sh -c 'npx prisma generate'`
3. Retry.

### 5.3 Smoke tests (chỉ khi có endpoint mới)

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/<new-endpoint>" | jq .
```

Test cases: happy path (200/201) · no token (401) · wrong role (403) · bad input (400) · not found (404).

### 5.4 Fix loop

Nếu có lỗi: ghi rõ file + dòng + message → fix → quay lại 5.1.
Không chuyển sang Phase 6 khi còn lỗi nghiêm trọng.

---

## Phase 6 — Đồng bộ Tài liệu & Tracking

### 6.1 Cập nhật `TASKS.md`

- Tasks hoàn thành: `⬜` → `✅`
- Tasks đang làm: `⬜` → `🔄`
- Blocked: giữ `⬜` + comment `<!-- blocked: <lý do> -->`

### 6.2 Cập nhật Sprint Plan — đánh dấu tasks đã xong

Trong `docs/plans/sprint-<NN>-<slug>.md`, đổi checkbox tasks vừa implement:
```markdown
- [x] S<NN>-XX: <mô tả task> ✅
```

### 6.3 Cập nhật `docs/IMPLEMENTATION_DETAILS.md`

Đổi entry vừa tạo ở Phase 2.3 từ `🔄 In Progress` → `✅ Completed`, bổ sung:
```markdown
**Outcome:** <kết quả thực tế, những gì đã deliver>
**Completed:** <YYYY-MM-DD>
```

### 6.4 Cập nhật `deployment-status.json`

```json
{
  "_meta": {
    "updated_at": "<ISO timestamp — date -u +%Y-%m-%dT%H:%M:%SZ>"
  },
  "backend": {
    "modules": {
      "<module-name>": {
        "status": "IMPLEMENTED",
        "endpoints": ["GET /api/v1/<name>", "POST /api/v1/<name>"]
      }
    }
  },
  "next_tasks": ["<tasks còn ⬜>"]
}
```

### 6.5 Prepend `docs/PROGRESS_LOG.md` (entry hoàn thành)

Thêm vào **ĐẦU file**:

```markdown
## <YYYY-MM-DD> — Sprint <NN>: <Tên tính năng> hoàn thành

- ✅ <task 1>
- ✅ <task 2>
- Branch: `feat/sprint-<NN>-<slug>` pushed
- Sprint plan: `docs/plans/sprint-<NN>-<slug>.md` cập nhật
- Report: xem Phase 7 report
```

### 6.6 Tạo/Append Sprint Report (`docs/reports/sprint-<NN>.md`)

Nếu file chưa có → tạo mới. Nếu đã có → append section:

```markdown
# Sprint <NN> Report — <Sprint Goal>

**Cập nhật:** <YYYY-MM-DD>

## Tính năng đã implement

### <Tên tính năng>
- **BE:** <endpoints mới>
- **FE:** <pages/components mới>
- **Tests:** <coverage>

## Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/<endpoint> | jq .
```

## Known Issues
- <issue hoặc "Không có">
```

---

## Phase 7 — Git Commit & Push

### 7.1 Stage files theo nhóm (KHÔNG `git add -A`)

```bash
# Backend
git add packages/backend/src/modules/<changed>/
git add packages/backend/src/app.module.ts
git add packages/backend/prisma/             # nếu có migration

# Frontend
git add packages/frontend/src/pages/<changed>/
git add packages/frontend/src/App.tsx
git add packages/frontend/src/types/
git add packages/frontend/src/hooks/
git add packages/frontend/src/components/

# Docs & tracking
git add docs/SRS.md
git add docs/IMPLEMENTATION_DETAILS.md
git add docs/PROGRESS_LOG.md
git add docs/plans/sprint-<NN>-<slug>.md
git add docs/reports/sprint-<NN>.md
git add TASKS.md
git add deployment-status.json
```

Kiểm tra: KHÔNG có `.env`, `.env.*`, `*.secret`, `node_modules/`.

### 7.2 Commit

```bash
git commit -m "$(cat <<'EOF'
feat(sprint-<N>): <tên tính năng ngắn gọn>

- [BE] <mô tả backend changes>
- [FE] <mô tả frontend changes>
- Docs: SRS, sprint plan, IMPLEMENTATION_DETAILS, TASKS updated

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### 7.3 Push

```bash
git push -u origin feat/sprint-<N>-<slug>
```

### 7.4 Báo kết quả cho User

```
✅ Feature delivery hoàn thành

Branch:  feat/sprint-<N>-<slug>
PR target: feat/sprint-<N>-<slug> → sprint/<N> (hoặc main)

📄 Tài liệu đã cập nhật:
- docs/SRS.md                       — section <X.Y> thêm mới
- docs/plans/sprint-<NN>-<slug>.md  — task mới + tasks ✅
- docs/IMPLEMENTATION_DETAILS.md    — entry mới ✅ Completed
- docs/PROGRESS_LOG.md              — 2 entries (bắt đầu + hoàn thành)
- docs/reports/sprint-<NN>.md       — report cập nhật
- TASKS.md                          — <N> tasks ✅
- deployment-status.json            — updated <timestamp>

🔌 Endpoints mới:
- <METHOD> /api/v1/<path>

🖥 Pages mới:
- /<route>

🧪 Verify:
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/<endpoint> | jq .
```

---

## Checklist cuối (KHÔNG bỏ qua)

### Sprint Plan
- [ ] `docs/plans/sprint-<NN>-*.md` tồn tại và đã được đọc trước khi implement
- [ ] Tính năng mới được append vào sprint plan (không tạo file mới trừ khi sprint mới)
- [ ] Tasks trong sprint plan đánh dấu `[x]` cho những gì đã xong

### Tài liệu
- [ ] `docs/SRS.md` — yêu cầu mới ghi đúng section
- [ ] `docs/IMPLEMENTATION_DETAILS.md` — entry `✅ Completed`
- [ ] `docs/PROGRESS_LOG.md` — 2 entries prepended (bắt đầu + hoàn thành)
- [ ] `docs/reports/sprint-<NN>.md` — tạo hoặc append

### Code
- [ ] TypeScript: `tsc --noEmit` — 0 lỗi mới
- [ ] Docker build pass
- [ ] Smoke tests pass (nếu có endpoint mới)
- [ ] 401 / 403 / 400 / 404 hoạt động đúng

### Backend
- [ ] `@ApiOperation` trên mọi endpoint
- [ ] `@IsIn()` thay vì `@IsEnum()`
- [ ] List endpoints: pagination + filter + sort
- [ ] Soft delete (không hard delete)
- [ ] Module đăng ký trong `app.module.ts`
- [ ] Unit tests viết cho service methods

### Frontend
- [ ] Route mới trong `App.tsx`
- [ ] TanStack Query cache keys đúng
- [ ] React Hook Form + Zod validation
- [ ] Skeleton loader (không Spinner)
- [ ] Destructive actions có Popconfirm
- [ ] Không `console.log` trực tiếp

### Tracking
- [ ] `TASKS.md` tasks đúng trạng thái
- [ ] `deployment-status.json` `updated_at` mới nhất

### Git
- [ ] Branch `feat/sprint-<N>-<slug>` từ đúng base branch
- [ ] Không commit secrets
- [ ] Conventional commit message
- [ ] Push `-u origin` thành công
