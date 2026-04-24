# Sprint Reports

Thư mục này chứa báo cáo từng sprint của dự án SystemManager.

## Cấu trúc

```
reports/
├── README.md                    # File này
├── sprint-template.md           # Template báo cáo sprint
├── sprint-00-bootstrap.md       # Sprint 0: Bootstrap & Infrastructure (DONE)
├── sprint-01.md                 # Sprint 1: User & UserGroup Backend
├── sprint-02.md                 # Sprint 2: Admin Frontend
└── ...
```

## Quy ước đặt tên

- `sprint-XX-<short-name>.md` — báo cáo sprint đã hoàn thành (có tên mô tả)
- `sprint-XX.md` — báo cáo sprint chưa bắt đầu hoặc đang thực hiện

## Khi nào tạo report

1. **Đầu sprint**: copy `sprint-template.md`, điền goal + planned tasks
2. **Giữa sprint**: cập nhật blockers, thay đổi scope
3. **Cuối sprint**: điền actual velocity, achievements, retrospective

## Liên kết

- [TASKS.md](../TASKS.md) — Agile task list đầy đủ với sprint plan
- [deployment-status.json](../deployment-status.json) — Trạng thái runtime hiện tại
- [docs/SRS.md](../docs/SRS.md) — Software Requirements Specification
