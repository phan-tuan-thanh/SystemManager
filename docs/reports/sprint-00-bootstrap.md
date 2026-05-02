# Sprint 00 — Khởi tạo Dự án & Kiến trúc Base (Bootstrap)

**Ngày bắt đầu:** 2026-04-01  
**Ngày kết thúc:** 2026-04-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Thiết lập nền tảng kỹ thuật cho toàn bộ hệ thống SystemManager. Xây dựng cấu trúc Monorepo (Turborepo), thiết lập quy chuẩn code (Linting, Formatting) và hạ tầng Docker để đảm bảo môi trường phát triển nhất quán.

## 2. Kiến trúc Hệ thống (Architecture Overview)

- **Backend:** NestJS (Node.js framework), Prisma ORM, PostgreSQL.
- **Frontend:** React (Vite), Ant Design v5, TanStack Query, Zustand.
- **Cấu trúc Monorepo:** 
  - `packages/backend`: REST API server.
  - `packages/frontend`: Single Page Application (SPA).
  - `packages/common`: Shared types & constants.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (NestJS Foundation)
- **Database Connection:** Sử dụng `PrismaService` làm singleton để quản lý pool connection tới PostgreSQL.
- **Global Pipes/Filters:** Thiết lập `ValidationPipe` để tự động validate DTO và `HttpExceptionFilter` để chuẩn hoá format lỗi JSON trả về cho Frontend.
- **Logging:** Tích hợp `Winston` logger để ghi nhật ký hệ thống ra console và file (phân loại theo level: info, error, warn).

### 3.2. Tầng Frontend (React/AntD Foundation)
- **API Client:** Cấu hình `Axios` instance (`apiClient.ts`) với cơ chế `interceptors` để tự động đính kèm JWT Token vào header của mọi request.
- **UI Framework:** Tích hợp **Ant Design v5** với cơ chế `ConfigProvider` để quản lý theme (Primary color, Border radius) nhất quán toàn app.
- **State Management:** Thiết lập `Zustand` cho các global state nhẹ (Auth, Sidebar status) và `TanStack Query` để cache dữ liệu từ Server.

## 4. Đặc tả API Interfaces (Base)

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/health` | `GET` | Kiểm tra trạng thái hệ thống | `@Public()` |
| `/system/status` | `GET` | Lấy thông tin phiên bản & init status | `@Public()` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Frontend:** Axios interceptor bắt lỗi `401` để tự động điều hướng người dùng về trang Login khi token hết hạn.
- **Backend:** Toàn bộ exception được bắt tại `GlobalFilter` để tránh lộ stack trace kỹ thuật ra môi trường Production.

## 6. Hướng dẫn Bảo trì & Debug

- **Khởi chạy:** `npm run dev` từ root directory để khởi động cả 2 apps cùng lúc qua Turborepo.
- **Database:** Sử dụng `npx prisma studio` để trực quan hoá dữ liệu trong quá trình dev.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 8 (Turborepo setup, Prisma init, Dockerize, API Base, Frontend Boilerplate)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
