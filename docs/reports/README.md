# Báo cáo Triển khai Dự án (Project Implementation Reports)

Thư mục này chứa toàn bộ lịch sử triển khai và đặc tả kỹ thuật chi tiết theo từng Sprint của dự án **SystemManager**.

> [!IMPORTANT]
> **Tiêu chuẩn Tài liệu:** Toàn bộ báo cáo từ Sprint 00 đến Sprint 23 đã được nâng cấp lên chuẩn **Deep Dive Technical Specification**. Nội dung bao gồm chi tiết luồng xử lý (Business Logic) ở cả tầng Backend (NestJS) và Frontend (React/AntD).

## Danh mục Tài liệu Cốt lõi

1.  **[AGILE_REQUIREMENTS.md](AGILE_REQUIREMENTS.md)**: Danh mục Epic và User Stories (Acceptance Criteria) - Nguồn tham chiếu cho Sprint Reports.
2.  **[sprint-00-bootstrap.md](sprint-00-bootstrap.md)**: Thiết lập nền tảng, Infrastructure & Auth.
3.  **[sprint-14.md](sprint-14.md)**: Chi tiết Engine Topology 2D & Layout Algorithms.
4.  **[sprint-21.md](sprint-21.md)**: Hệ thống ChangeSets & So sánh cấu hình.

## Cấu trúc thư mục

```text
reports/
├── README.md                    # File này
├── AGILE_REQUIREMENTS.md        # Yêu cầu Agile (User Stories)
├── sprint-template.md           # Template báo cáo sprint chuẩn
├── sprint-00-bootstrap.md       # Báo cáo chi tiết từng Sprint
└── ...
```

## Liên kết Quan trọng

- **[deployment-status.json](../../deployment-status.json)**: Trạng thái triển khai và build state hiện tại.
- **[SRS.md](../../docs/SRS.md)**: Đặc tả yêu cầu phần mềm (High-level).
- **[TASKS.md](../../TASKS.md)**: Danh sách Task chi tiết và phân bổ point.
