# Sprint 09 — System Management & CSV Import

**Ngày bắt đầu:** 2026-04-17  
**Ngày kết thúc:** 2026-04-17 (Hoàn thành sớm trong ngày)  
**Sprint Goal:** Hoàn thiện module Quản lý Hệ thống hạ tầng (InfraSystem), phân quyền truy cập và tính năng Import CSV chuyên sâu.  
**Trạng thái:** DONE

---

## Sprint Goal

> Xây dựng lớp quản lý logic cao hơn cho hạ tầng (nhóm theo Hệ thống nghiệp vụ), cho phép phân quyền người dùng theo từng hệ thống cụ thể và cung cấp công cụ Import dữ liệu hàng loạt mạnh mẽ, có khả năng preview và ghi đè ngữ cảnh (Site/Environment).

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S9-QA | Fix 3 bugs QA từ Sprint 8 (Pagination, Field mismatch) | 3 | ✅ |
| S9-01 | `[BE]` Prisma schema & migrations cho InfraSystem & Access | 4 | ✅ |
| S9-03 | `[BE]` InfraSystem CRUD & Access Management Logic | 8 | ✅ |
| S9-05 | `[BE]` CSV Import Service (Multi-entity creation + validation) | 13 | ✅ |
| S9-09 | `[FE]` InfraSystem Pages (List, Detail, Access Control) | 10 | ✅ |
| S9-12 | `[FE]` Advanced CSV Import Modal (PapaParse preview + overrides) | 10 | ✅ |
| S9-UI | Fix global scroll & Topology rendering issues | 4 | ✅ |

**Planned Velocity:** 52 points
**Actual Velocity:** 52 points

---

## Blockers & Decisions

| Blocker | Nguyên nhân | Giải pháp | Trạng thái |
|---|---|---|---|
| Lỗi cuộn trang | `AppLayout` dùng `overflow: hidden` | Chuyển sang `overflow: auto` và fix height thủ công cho Topology | ✅ Fixed |
| Import missing `infra_system_id` | Logic Service chưa gán ID hệ thống cho Server | Cập nhật transactional import để map ID trước khi create | ✅ Fixed |

---

## Achievements

_Hoàn thành sau sprint:_

- [x] **Hệ thống mới (InfraSystem)**: Cho phép gom nhóm server theo nghiệp vụ (LOS, BPM...).
- [x] **Phân quyền Infra**: Gán quyền truy cập hệ thống cho User/Group (ADMIN, OPERATOR, VIEWER).
- [x] **CSV Import 2.0**:
    - Tải file mẫu chuẩn.
    - Preview dữ liệu trực tiếp tại trình duyệt bằng `papaparse`.
    - Ghi đè (Override) Môi trường, Site, Hệ thống cho toàn bộ file.
    - Báo cáo kết quả chi tiết từng đối tượng được tạo hoặc trùng lặp.
- [x] **UI Polish**: Sửa lỗi giao diện không cuộn được, cải thiện layout Topology.

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 52 | 52 |
| Tasks Completed | 14 | 14 |
| Tasks Carried Over | 0 | 0 |
| New Bugs Found | 0 | 0 |

---

## Demo Notes

_Các điểm cần demo / verify sau sprint:_

1. **Import CSV**: Dùng file `LOS_System.csv`, chọn override System = "Hệ thống LOS", kiểm tra Server được tạo có đúng hệ thống không.
2. **Access Control**: Dùng tài khoản VIEWER, kiểm tra chỉ xem được các hệ thống đã được gán quyền.
3. **Scroll Check**: Mở trang Audit Log với nhiều dữ liệu, kiểm tra xem có cuộn xuống dưới được không.

**Demo commands:**
```bash
# Kiểm tra API import template
curl http://localhost:3000/api/v1/infra-systems/import/template

# Rebuild if needed
docker compose up backend -d --build
```

---

## Retrospective

### What went well
- Tích hợp thành công `papaparse` giúp UX của phần Import chuyên nghiệp hơn hẳn.
- Cơ chế InfraSystemAccess hoạt động ổn định và nhất quán giữa Backend/Frontend.

### What could be improved
- Service Import hiện tại xử lý đồng bộ, nếu file > 1000 dòng có thể gây timeout. Cần xem xét chuyển sang Queue ở các phase sau.

---

## Next Sprint Preview

**Sprint 10 Goal:** Topology 3D Visualization & Realtime Status  
**Key tasks planned:**
- GraphQL Subscriptions cho server/connection status.
- Tích hợp React Three Fiber để hiển thị mô hình 3D.
- Chế độ 2D/3D switcher.

---

_Report tạo bởi: Antigravity Agent_  
_Cập nhật lần cuối: 2026-04-17_
