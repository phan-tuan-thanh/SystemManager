# SystemManager — Tài liệu Bàn giao Kỹ thuật

**Phiên bản:** Sprint 19 (2026-04-30)  
**Trạng thái:** Production-ready core, đang mở rộng tính năng  
**Repository:** `phan-tuan-thanh/SystemManager`

---

## Giới thiệu

**SystemManager** là hệ thống quản lý hạ tầng server và ứng dụng triển khai, được thiết kế cho môi trường doanh nghiệp (ngân hàng/enterprise). Hệ thống cho phép:

- Quản lý tập trung toàn bộ **server vật lý/ảo hóa** (inventory, hardware, network)
- Theo dõi **ứng dụng triển khai** (deployment, ports, tài liệu kỹ thuật)
- Vẽ **sơ đồ topology** kết nối giữa các hệ thống (2D/3D, interactive)
- Quản lý **thay đổi hạ tầng** an toàn qua cơ chế ChangeSet (Draft → Preview → Apply)
- **Audit log** tự động toàn bộ thao tác, không cần code thêm

---

## Mục lục Tài liệu

| File | Nội dung |
|------|----------|
| [01_ARCHITECTURE.md](01_ARCHITECTURE.md) | Kiến trúc hệ thống, C4 diagrams, quyết định kỹ thuật |
| [02_DATA_MODEL.md](02_DATA_MODEL.md) | Schema database đầy đủ, quan hệ bảng, ER diagram |
| [03_API_REFERENCE.md](03_API_REFERENCE.md) | Tham chiếu API REST đầy đủ cho tất cả modules |
| [04_FRONTEND_ARCHITECTURE.md](04_FRONTEND_ARCHITECTURE.md) | Cấu trúc frontend, routing, state management, conventions |
| [05_DEVELOPMENT_GUIDE.md](05_DEVELOPMENT_GUIDE.md) | Setup môi trường dev, quy tắc code, git workflow |
| [06_DEPLOYMENT_GUIDE.md](06_DEPLOYMENT_GUIDE.md) | Docker Compose, biến môi trường, production checklist |
| [07_FUNCTIONAL_SPEC.md](07_FUNCTIONAL_SPEC.md) | Đặc tả chức năng chi tiết từng module |
| [08_PROJECT_HANDOVER.md](08_PROJECT_HANDOVER.md) | Lịch sử sprint, backlog, known issues, next steps |

---

## Quick Start (5 phút)

### Yêu cầu
- Docker Desktop 4.x+
- Git

### Chạy hệ thống

```bash
git clone git@github.com:phan-tuan-thanh/SystemManager.git
cd SystemManager
cp .env.example .env          # Xem 06_DEPLOYMENT_GUIDE.md cho biến bắt buộc
docker compose up -d
```

Sau ~60 giây:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/v1
- **Swagger UI:** http://localhost:3000/api/docs

### Tài khoản mặc định

| Email | Password | Role |
|-------|----------|------|
| `admin@system.local` | `Admin@123` | ADMIN |
| `operator@system.local` | `Admin@123` | OPERATOR |
| `viewer@system.local` | `Admin@123` | VIEWER |

> Tài khoản được tạo tự động bởi seeder khi khởi động lần đầu.

---

## Tech Stack Tóm tắt

| Layer | Technology | Phiên bản |
|-------|-----------|-----------|
| Backend | NestJS + TypeScript | NestJS 10, TS 5 |
| Database | PostgreSQL + Prisma ORM | PG 15, Prisma 5 |
| Frontend | React + Vite + Ant Design | React 18, Vite 5, AntD 5 |
| State | TanStack Query + Zustand | TQ 5, Zustand 4 |
| Infra | Docker Compose | Compose v2 |
| Auth | JWT (access 15m + refresh 7d) + MS365 SSO | — |
| Topology 2D | React Flow + vis-network + Mermaid | — |
| Topology 3D | React Three Fiber | — |

---

## Cấu trúc Monorepo

```
SystemManager/
├── packages/
│   ├── backend/          # NestJS API + Prisma
│   │   ├── prisma/       # Schema + migrations + seed
│   │   └── src/
│   │       ├── common/   # Guards, decorators, interceptors dùng chung
│   │       └── modules/  # 22 NestJS modules (1 module = 1 domain)
│   ├── frontend/         # React + Vite SPA
│   │   └── src/
│   │       ├── pages/    # 20 page groups (1 folder = 1 domain)
│   │       ├── api/      # Axios hooks + TanStack Query
│   │       └── stores/   # Zustand global state
│   └── docs/             # Tài liệu bàn giao (thư mục này)
├── docs/                 # Sprint docs (SRS, TASKS, plans, reports)
├── demo/csv/             # File CSV mẫu để import dữ liệu
├── docker-compose.yml
└── start.sh              # Script khởi động nhanh
```

---

## Liên hệ & Hỗ trợ

- **Repo chính:** https://github.com/phan-tuan-thanh/SystemManager
- **Swagger:** http://localhost:3000/api/docs (khi chạy local)
- **Tài liệu SRS gốc:** `docs/SRS.md`
- **Sprint tasks:** `TASKS.md`
