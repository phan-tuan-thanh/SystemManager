# Sprint 00 — Bootstrapping & Infrastructure

**Ngày bắt đầu:** 2026-04-01  
**Ngày kết thúc:** 2026-04-06  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Thiết lập nền tảng dự án Monorepo (Turborepo), cấu trúc thư mục tiêu chuẩn, và môi trường phát triển dựa trên Docker Compose. Đảm bảo tính nhất quán giữa Backend (NestJS) và Frontend (React/AntD) thông qua Shared Types và Client-side API Interceptors.

## 2. Kiến trúc & Schema Database (Architecture)

- **Monorepo Structure:** 
  - `packages/backend`: NestJS Framework, Prisma ORM, Winston Logger.
  - `packages/frontend`: Vite + React, Ant Design v5, Zustand state management.
- **Infrastructure:**
  - `docker-compose.yml`: Quản lý 3 services chính: `postgres` (Database), `backend` (API), `frontend` (UI).
- **Database Initial:** Cấu hình Prisma Client cơ bản nối kết với PostgreSQL, thiết lập `PrismaService` kế thừa `PrismaClient` để quản lý lifecycle kết nối.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. API Client Interceptor (Frontend)
- **Cơ chế:** Sử dụng Axios interceptor tại `packages/frontend/src/api/client.ts`.
- **Request Interceptor:** Tự động lấy `accessToken` từ localStorage và gán vào header `Authorization: Bearer <token>`.
- **Response Interceptor:** 
  - Tự động bắt lỗi 401 để xóa token và chuyển hướng về trang Login.
  - Unwrap dữ liệu từ cấu trúc `{ data: ... }` của Backend trả về để UI sử dụng trực tiếp.

### 3.2. Cấu trúc Module NestJS
- Áp dụng mô hình Dependency Injection (DI) của NestJS.
- Mỗi module nghiệp vụ bao gồm: `*.module.ts`, `*.controller.ts`, `*.service.ts` và thư mục `dto/` để validate dữ liệu đầu vào bằng `class-validator`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Trạng thái |
|---|---|---|---|
| `/health` | `GET` | Kiểm tra sức khoẻ hệ thống & kết nối DB | ✅ Hoàn thành |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Cấu hình Global Pipe:** Tích hợp `ValidationPipe` tại `main.ts` để tự động ném lỗi `BadRequestException` (400) nếu DTO không thoả mãn validation.

## 6. Hướng dẫn Bảo trì & Debug

- **Rebuild môi trường:** Sử dụng `docker compose down -v && docker compose up -d --build`.
- **Prisma Studio:** Chạy `npx prisma studio` trong `packages/backend` để xem dữ liệu trực quan.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 8 (Thiết lập Repo, Docker, Prisma, Auth skeleton, UI layout, CI config)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
