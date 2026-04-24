# Update Docs — Documentation Synchronization Pipeline

Đồng bộ toàn bộ tài liệu dự án (SRS, Implementation Details, Progress Log, TASKS, deployment-status) để phản ánh chính xác trạng thái code và tiến độ hiện tại.

## Input
- Update description: $ARGUMENTS (e.g., "cập nhật tiến độ Sprint 15, bổ sung yêu cầu import server từ CSV")

---

## CRITICAL — Quy tắc bất biến (KHÔNG vi phạm)

- **KHÔNG XÓA** nội dung lịch sử trong bất kỳ file tài liệu nào — chỉ thêm hoặc sửa.
- **KHÔNG OVERWRITE** PROGRESS_LOG.md — luôn prepend entry mới vào đầu file.
- **KHÔNG COMMIT** `.env`, secrets, `node_modules`.
- Nếu không chắc một thông tin là đúng → ghi `[TBD]` thay vì bịa.

---

## Phase 0 — Bootstrap (Đọc toàn bộ context trước khi viết bất cứ điều gì)

### 0.1 Đọc project rules
```
CLAUDE.md              — conventions, module rules, phase priorities
```

### 0.2 Đọc trạng thái hiện tại
```
TASKS.md               — task status (⬜ / 🔄 / ✅), sprint hiện tại
deployment-status.json — version, sprint, overall_pct, module breakdown
docs/PROGRESS_LOG.md   — entry gần nhất (để biết điểm bắt đầu)
docs/SRS.md            — sections liên quan đến $ARGUMENTS
docs/IMPLEMENTATION_DETAILS.md — các quyết định kỹ thuật đã có
```

### 0.3 Phân tích thay đổi code (QUAN TRỌNG)

Chạy các lệnh sau để hiểu những gì thực sự đã thay đổi trong code:

```bash
# Các commit kể từ entry cuối cùng trong PROGRESS_LOG.md
git log --oneline -20

# Danh sách file đã thay đổi so với main
git diff main --name-only 2>/dev/null || git diff HEAD~5 --name-only

# Tóm tắt diff để trích xuất thông tin kỹ thuật
git diff main --stat 2>/dev/null || git diff HEAD~5 --stat
```

Sau khi chạy, xác định:
- **Sprint đang hoạt động**: lấy từ `TASKS.md` hoặc `deployment-status.json`
- **Các task hoàn thành**: so sánh git log với task list
- **Files đã thay đổi**: sẽ dùng để điền `Files impacted` trong IMPLEMENTATION_DETAILS.md
- **Loại thay đổi**: `[BE]` / `[FE]` / `[INT]` / `[DOCS]`

### 0.4 Parse $ARGUMENTS

Từ `$ARGUMENTS`, xác định:
- **Mục đích update**: tiến độ sprint / yêu cầu mới / kết thúc sprint / đầu sprint mới
- **Sprint target**: sprint số mấy (nếu không nêu rõ → lấy từ `deployment-status.json`)
- **Phạm vi**: module nào / tính năng nào được đề cập

---

## Phase 1 — Cập nhật Tài liệu Kỹ thuật

### 1.1 Cập nhật `docs/SRS.md` (chỉ khi có yêu cầu mới)

Điều kiện kích hoạt: $ARGUMENTS đề cập đến yêu cầu mới, tính năng mới, hoặc thay đổi quy trình.

Tìm section tương ứng (ví dụ `4.1`, `4.7.3`), append section mới — **KHÔNG xóa nội dung cũ**:

```markdown
### <section>.<N+1> <Tên tính năng>
**Mô tả:** <mô tả ngắn>
**Actor:** <ADMIN | OPERATOR | VIEWER>
**Acceptance Criteria:**
- AC1: <criterion>
- AC2: <criterion>
**Added:** <YYYY-MM-DD>
```

### 1.2 Cập nhật `docs/IMPLEMENTATION_DETAILS.md` (khi có thay đổi kỹ thuật)

Điều kiện kích hoạt: git diff cho thấy có file code đã thay đổi, hoặc $ARGUMENTS đề cập đến implementation.

Prepend entry mới vào đầu phần nội dung (sau header):

```markdown
## <Tên tính năng/Thay đổi> (<YYYY-MM-DD>)

**Status:** <✅ Completed | 🔄 In Progress>
**Context:** <Lý do thay đổi hoặc vấn đề cần giải quyết>
**Decision:** <Cách tiếp cận kỹ thuật đã chọn và lý do>
**Technical Implementation:**
1. <Chi tiết kỹ thuật 1>
2. <Chi tiết kỹ thuật 2>
**Files impacted:** (lấy từ git diff --name-only)
- `<path/to/file>` — <mô tả thay đổi>
**Trade-offs:** <Các cân nhắc đánh đổi, nếu có>
```

---

## Phase 2 — Cập nhật Trạng thái & Tiến độ

### 2.1 Cập nhật `TASKS.md`

- Đổi status task đã hoàn thành: `⬜` → `✅`
- Đổi task đang làm: `⬜` → `🔄`
- Task bị blocked: giữ `⬜`, thêm comment `<!-- blocked: <lý do> -->`
- Nếu có sprint mới: thêm sprint block trước phần Backlog (KHÔNG xóa sprint cũ)
- Cập nhật bảng "Tổng kết roadmap" ở cuối file nếu Phase thay đổi trạng thái

**Format sprint block mới:**
```markdown
## Sprint <NN> — <Sprint Goal> 🔄 IN PROGRESS

**Mục tiêu:** <goal>
**Thời gian:** <YYYY-MM-DD> → <YYYY-MM-DD>
**Branch:** `feat/sprint-<NN>-<slug>` hoặc `sprint/<NN>`

| # | Task | Points | Status |
|---|------|--------|--------|
| S<NN>-01 | `[FE]` <mô tả> | N | ⬜ |
```

### 2.2 Cập nhật `docs/PROGRESS_LOG.md`

**LUÔN PREPEND** — thêm entry mới vào ĐẦU file (sau dòng header `# PROGRESS LOG`):

```markdown
## <YYYY-MM-DD>: Sprint <N> — <Tên Sprint/Tính năng>
**Status:** <✅ Completed | 🔄 In Progress>

### Thay đổi
- <Mô tả thay đổi 1 — module/file liên quan>
- <Mô tả thay đổi 2>

### Tasks hoàn thành
- ✅ S<N>-XX: <tên task>

### Tài liệu liên quan
- Plan: `docs/plans/<file>.md` (nếu có)
- Report: `docs/reports/sprint-<NN>.md` (nếu có)
```

### 2.3 Cập nhật `deployment-status.json`

Cập nhật các trường sau (dựa vào TASKS.md và git diff):

```json
{
  "_meta": {
    "updated_at": "<ISO 8601 timestamp — dùng lệnh: date -u +%Y-%m-%dT%H:%M:%SZ>"
  },
  "current_sprint": <sprint number — lấy từ TASKS.md>,
  "progress": {
    "overall_pct": <tính bằng: (số task ✅ / tổng số task) * 100, làm tròn>,
    "breakdown": {
      "<module-name>": <% hoàn thành dựa trên task ✅ trong TASKS.md cho module đó>
    }
  },
  "backend": {
    "modules": {
      "<module>": {
        "status": "<IMPLEMENTED | IN_PROGRESS | PLANNED>",
        "endpoints": ["<METHOD> /api/v1/<path>"]
      }
    }
  },
  "next_tasks": ["<task ID và mô tả ngắn của các task ⬜ tiếp theo>"]
}
```

**Cách tính overall_pct:**
1. Đếm tất cả task trong TASKS.md (không tính header/comment)
2. Đếm số task có `✅`
3. `overall_pct = Math.round((done / total) * 100)`

### 2.4 Cập nhật `CLAUDE.md` (chỉ khi phase priority thay đổi)

Điều kiện: một phase vừa hoàn thành (`Done`), hoặc phase hiện tại thay đổi mục tiêu.

Chỉ cập nhật section **"Phase Priorities"** — không chỉnh sections khác:
```markdown
## Phase Priorities

- **Phase N (Current)**: <Goal>. Focus: <mô tả focus hiện tại>.
- **Phase N-1 (Done)**: <Goal>.
```

---

## Phase 3 — Tạo File Kế hoạch / Báo cáo

### Điều kiện kích hoạt:

| Điều kiện | Hành động |
|-----------|-----------|
| $ARGUMENTS đề cập "đầu sprint" / sprint mới | Tạo `docs/plans/sprint-<NN>-<slug>.md` |
| $ARGUMENTS đề cập "cuối sprint" / sprint kết thúc | Tạo `docs/reports/sprint-<NN>.md` |
| Không đề cập | Bỏ qua Phase 3 |

### Template: `docs/plans/sprint-<NN>-<slug>.md`

```markdown
# Kế hoạch Sprint <NN> — <Sprint Goal>

**Dự án:** SystemManager
**Thời gian:** <YYYY-MM-DD> → <YYYY-MM-DD + 7 ngày>
**Branch:** `sprint/<NN>` hoặc `feat/sprint-<NN>-<slug>`

## Mục tiêu Sprint

<Mô tả 2-3 câu về mục tiêu chính>

## Tasks

| # | Type | Mô tả | Points |
|---|------|-------|--------|
| S<NN>-01 | `[FE]` | <mô tả> | N |

## Files dự kiến thay đổi

- `<path>` — <lý do>

## Definition of Done

- [ ] TypeScript: `tsc --noEmit` pass
- [ ] Docker build pass
- [ ] Smoke tests pass
- [ ] Tài liệu cập nhật
```

### Template: `docs/reports/sprint-<NN>.md`

```markdown
# Sprint <NN> Report — <Sprint Goal>

**Ngày hoàn thành:** <YYYY-MM-DD>
**Tasks:** <done>/<total> hoàn thành | <points> story points

## Tóm tắt

<Mô tả ngắn gọn những gì đã deliver>

## Tasks hoàn thành

| # | Task | Points |
|---|------|--------|
| S<NN>-XX | <mô tả> | N |

## Tính năng đã deliver

### [FE] <Tên tính năng>
- <mô tả chi tiết>
- Files: `<path>`

### [BE] <Tên tính năng>
- Endpoints: `GET /api/v1/<path>`
- Files: `<path>`

## Blockers & Lessons Learned

- <vấn đề gặp phải và cách giải quyết, hoặc "Không có">

## Verify Commands

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.access_token')

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/<endpoint>" | jq .
```
```

---

## Phase 4 — Kiểm tra Tính Nhất quán

### 4.1 Checklist tự kiểm tra

- [ ] Sprint number trong `TASKS.md` khớp với `deployment-status.json.current_sprint`
- [ ] `overall_pct` trong `deployment-status.json` được tính đúng từ task ✅
- [ ] Không có nội dung lịch sử bị xóa trong bất kỳ file nào
- [ ] Markdown links trong các file vừa edit trỏ đúng file tồn tại
- [ ] `docs/PROGRESS_LOG.md` có entry mới ở ĐẦU file (không phải cuối)
- [ ] `deployment-status.json` có `updated_at` mới nhất

### 4.2 Git commit tài liệu (nếu user yêu cầu)

```bash
# Stage chỉ docs files
git add docs/SRS.md
git add docs/IMPLEMENTATION_DETAILS.md
git add docs/PROGRESS_LOG.md
git add docs/plans/              # nếu có file mới
git add docs/reports/            # nếu có file mới
git add TASKS.md
git add deployment-status.json
git add CLAUDE.md                # chỉ nếu đã edit

git commit -m "$(cat <<'EOF'
docs(sprint-<N>): sync documentation with current progress

- Updated TASKS.md: <N> tasks marked ✅
- Updated deployment-status.json: overall_pct → <X>%
- Added PROGRESS_LOG entry for <date>
- <Ghi thêm nếu có SRS/IMPLEMENTATION_DETAILS update>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### 4.3 Output báo cáo cho User

Sau khi hoàn thành, report theo format:

```
✅ Documentation update hoàn thành

📄 Files đã cập nhật:
- TASKS.md          — <N> task đổi sang ✅, <M> task mới thêm
- deployment-status.json — overall_pct: <old>% → <new>%
- docs/PROGRESS_LOG.md  — thêm entry <date>
- docs/SRS.md           — <section mới / "không thay đổi">
- docs/IMPLEMENTATION_DETAILS.md — <entry mới / "không thay đổi">
- docs/plans/<file>     — <tạo mới / "không tạo">
- docs/reports/<file>   — <tạo mới / "không tạo">

📊 Tiến độ:
- Sprint <N>: <done>/<total> tasks (overall: <X>%)
- Blockers: <danh sách hoặc "Không có">
```
