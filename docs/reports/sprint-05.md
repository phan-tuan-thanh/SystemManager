# Sprint 05 — Cấu hình Mạng (Network Interfaces)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Quản lý các giao diện mạng (Network Interfaces) và danh sách địa chỉ IP (IPv4/IPv6) gắn với từng Server.

## 2. Kiến trúc & Schema Database
- **Model:** `NetworkInterface` (mac_address, type).
- **Model:** `IpAddress` (ip, version, interface_id).

## 3. Luồng xử lý kỹ thuật & Business Logic
- **IP Validation:** Backend sử dụng Regex chuẩn để validate chuỗi IPv4 và IPv6 trước khi lưu.
- Hỗ trợ gán nhiều IP (Virtual IPs) trên cùng một Card Mạng (Network Interface).

---
## 7. Metrics & Tasks
_Hoàn thiện CRUD Mạng._
