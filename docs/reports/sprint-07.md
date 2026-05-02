# Sprint 07 — Upload Hồ sơ & Quản lý Tài liệu Triển khai

**Ngày bắt đầu:** 2026-04-19  
**Ngày kết thúc:** 2026-04-20  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý hồ sơ tài liệu gắn với từng bản triển khai (Deployment). Mục tiêu là tự động hoá việc nhắc nhở các loại tài liệu bắt buộc và cung cấp cơ chế upload/phê duyệt hồ sơ chuẩn mực.

## 2. Kiến trúc & Schema Database (Architecture & Schema Changes)

- **Model `DeploymentDocType`:** Định nghĩa các loại tài liệu (VD: Hướng dẫn cài đặt, Biên bản nghiệm thu). Có cờ `status` và mảng `environments` để lọc theo môi trường.
- **Model `DeploymentDoc`:** Bản ghi thực tế của một tài liệu. Lưu `preview_path`, `final_path`, `status` (`PENDING`, `PREVIEW`, `COMPLETE`, `WAIVED`).
- **Quan hệ:** `AppDeployment` (1) - (n) `DeploymentDoc`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tự động khởi tạo Hồ sơ (Auto-provisioning Docs)
- **Logic (`autoCreateDocs`):** Khi một `AppDeployment` được tạo mới, hệ thống tự động quét bảng `DeploymentDocType`.
- Nếu loại tài liệu đó được cấu hình cho môi trường tương ứng (hoặc cho mọi môi trường), hệ thống tự động tạo các bản ghi `DeploymentDoc` ở trạng thái `PENDING`.
- Điều này đảm bảo mỗi bản triển khai luôn có đầy đủ danh mục hồ sơ cần thiết ngay từ đầu.

### 3.2. Luồng Upload & Phê duyệt (Multer Integration)
- **Cơ chế:** Sử dụng `Multer` để xử lý file upload.
- **Phân loại:**
  - **Upload Preview:** Lưu vào thư mục `preview/`. Dùng để kiểm tra nội dung sơ bộ.
  - **Upload Final:** Lưu vào thư mục `final/`. Đánh dấu tài liệu đã hoàn tất (`COMPLETE`).
- **Waive Logic:** Cho phép người dùng bỏ qua một tài liệu bắt buộc nếu có lý do chính đáng (`waived_reason`).

### 3.3. Stream File An toàn
- API không trả về đường dẫn trực tiếp đến file trên disk mà sử dụng stream: `createReadStream(absolutePath).pipe(res)`.
- Hệ thống tự động ánh xạ đuôi file (pdf, docx, xlsx) sang chuẩn `MIME type` tương ứng để trình duyệt có thể hiển thị hoặc tải về chính xác.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/deployments/:id/upload-final` | `POST` | Upload bản cuối (Multipart) | `OPERATOR` |
| `/deployments/:id/serve-file` | `GET` | Tải/Xem file tài liệu | `VIEWER` |
| `/deployments/:id/waive` | `POST` | Miễn trừ tài liệu bắt buộc | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Disk Missing:** Nếu file trong DB tồn tại nhưng trên disk bị mất (do lỗi hạ tầng), hệ thống trả về `404 Not Found` thay vì crash.
- **Validation:** Chặn upload nếu file không thuộc danh mục cho phép hoặc vượt quá dung lượng quy định.

## 6. Hướng dẫn Bảo trì & Debug

- **File Storage:** File được lưu tại `uploads/deployments/{deploymentId}/`. Nếu muốn đổi sang S3, chỉ cần thay đổi implementation trong `FileUploadService`.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 9 (Document Schema, Multer config, Auto-create logic, File Streaming, Progress calculation)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
