# Sprint 07 — Upload Hồ sơ & Tài liệu (Deploy Docs)

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Cho phép người dùng đính kèm các file cấu hình, tài liệu hướng dẫn triển khai vào từng bản Deployment.

## 2. Kiến trúc & Schema Database
- **Model:** `Document` (file_name, url, mime_type, size).

## 3. Luồng xử lý kỹ thuật & Business Logic
- Sử dụng `Multer` trên backend để xử lý `multipart/form-data`.
- File upload được lưu ở thư mục local `uploads/` (có thể config sang S3/Minio sau này).
- File URL được tạo động dựa trên đường dẫn tĩnh (Static serve) của NestJS.

---
## 7. Metrics & Tasks
_Tích hợp Multer và UI đính kèm file._
