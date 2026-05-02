# Sprint 15 — Server Import & OS Lifecycle

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Hỗ trợ tracking vòng đời của hệ điều hành (OS Install) và logic ánh xạ (OS Resolution) khi Import file CSV.

## 2. Kiến trúc & Schema Database
- **Model mới:** `ServerOsInstall` (server_id, os_name, install_date). Lịch sử cài đặt OS.

## 3. Luồng xử lý kỹ thuật & Business Logic
- Tính năng OS Resolution: Khi file import ghi "Win 10" nhưng hệ thống ghi "Windows 10", API trả về danh sách gợi ý mapping để user chọn ở bước Import Preview.

---
## 7. Metrics & Tasks
_Hoàn thành OS Lifecycle Tracking._
