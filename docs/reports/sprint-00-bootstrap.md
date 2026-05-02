# Sprint 00 — Bootstrapping & Infrastructure

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Thiết lập nền tảng dự án (Monorepo), cấu trúc thư mục, môi trường phát triển (Docker) và CI/CD cơ bản cho toàn bộ hệ thống SystemManager.

## 2. Kiến trúc & Schema Database
- **Monorepo:** Sử dụng Turborepo. Quản lý chung `backend` (NestJS) và `frontend` (React/Vite).
- **Database:** PostgreSQL. Quản lý schema bằng Prisma ORM.

## 3. Luồng xử lý kỹ thuật & Business Logic
- Cấu trúc module NestJS theo mô hình Domain-Driven Design (DDD) cơ bản (mỗi tính năng là một module độc lập).
- Tích hợp Prisma Client toàn cục, sử dụng `PrismaService` cho mọi thao tác Database.
- Cấu hình Axios Interceptor trên Frontend để tự động đính kèm JWT Token vào mọi request.

## 4. Hướng dẫn Bảo trì & Debug
- **Database Migrations:** Sử dụng `npx prisma migrate dev` để đồng bộ schema. File định nghĩa schema nằm tại `packages/backend/prisma/schema.prisma`.

---
## 7. Metrics & Tasks
_Các cấu hình cơ bản đã hoàn tất._
