# Sprint 02 — Quản lý Server & Environment

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Cung cấp nền tảng quản lý danh mục Server và Môi trường (Environments). Hỗ trợ tra cứu nhanh Server thuộc môi trường nào (DEV, PROD...).

## 2. Kiến trúc & Schema Database
- **Model:** `Server` (hostname, ip, os, status). Sử dụng Soft Delete (`deleted_at`).
- **Enum:** `EnvironmentType` (DEV, UAT, PROD, DR).

## 3. Luồng xử lý kỹ thuật & Business Logic
- **Soft Delete Mechanism:** Khi gọi API DELETE, hệ thống không xoá thật khỏi DB mà set `deleted_at = NOW()`. Các API GET tự động thêm điều kiện `deleted_at: null`.
- **Validation:** Bắt buộc Server phải có IP và Hostname không được trùng lặp trong cùng một Môi trường.

## 5. Xử lý Lỗi & Ngoại lệ
- Ném lỗi `ConflictException` nếu tạo Server trùng Hostname.

---
## 7. Metrics & Tasks
_Thực hiện hoàn thiện CRUD API và UI List/Form cho Server._
