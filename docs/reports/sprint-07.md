# Sprint 07 — Upload Hồ sơ & Quản lý Tài liệu Triển khai

**Ngày bắt đầu:** 2026-04-19  
**Ngày kết thúc:** 2026-04-20  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống quản lý hồ sơ tài liệu gắn với từng bản triển khai (Deployment). Mục tiêu là tự động hoá việc nhắc nhở các loại tài liệu bắt buộc và cung cấp cơ chế upload/phê duyệt hồ sơ chuẩn mực.

## 2. Kiến trúc & Schema Database (Architecture)

- **Model `DeploymentDocType`:** Định nghĩa các loại tài liệu (VD: Hướng dẫn cài đặt).
- **Model `DeploymentDoc`:** Bản ghi thực tế của một tài liệu. Lưu `preview_path`, `final_path`.
- **Quan hệ:** `AppDeployment` (1) - (n) `DeploymentDoc`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Upload & Control Logic)
- **Auto-provisioning:** Khi tạo Deployment, backend tự động tạo các bản ghi `DeploymentDoc` trống dựa trên cấu hình môi trường.
- **File Streaming:** API `serve-file` không trả về link trực tiếp mà sử dụng `createReadStream(path).pipe(res)`. Hệ thống tự động ánh xạ đuôi file sang chuẩn **MIME type** (VD: `.pdf` -> `application/pdf`).
- **Phân loại Upload:**
  - **Bản nháp (Preview):** Chấp nhận `.pdf`, `.docx`, `.xlsx`. Lưu vào thư mục `preview/`.
  - **Bản chính thức (Final):** Chỉ chấp nhận `.pdf`. Khi upload thành công, tự động chuyển trạng thái tài liệu sang `COMPLETE`.

### 3.2. Tầng Frontend (Document Tracking UI)
- **Tiến độ trực quan (Progress Tracking):** Sử dụng component `Progress` của AntD để hiển thị % hoàn thành hồ sơ dựa trên tổng số tài liệu bắt buộc.
- **Dashboard Thống kê:** Sử dụng các `Statistic` cards hiển thị nhanh số lượng tài liệu Hoàn thành, Đang chờ, hoặc Đã miễn.
- **Upload Card Component:** Mỗi loại tài liệu có một card điều khiển riêng (`DocUploadCard`). UI thay đổi linh hoạt:
  - Nếu đã có bản nháp: Hiển thị nút "Xem nháp".
  - Nếu đã nộp bản PDF: Khoá chức năng upload và hiển thị nhãn "Hoàn thành".
- **Cơ chế Miễn trừ (Waive):** Tích hợp Modal yêu cầu nhập lý do (`waived_reason`) trước khi đánh dấu tài liệu là không bắt buộc.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/deployments/:id/upload-final` | `POST` | Upload bản cuối (Multipart) | `OPERATOR` |
| `/deployments/:id/serve-file` | `GET` | Tải/Xem file tài liệu | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Disk Missing:** Nếu file trong DB tồn tại nhưng trên disk bị mất, hệ thống trả về `404 Not Found`.
- **Validation:** Frontend chặn upload nếu file không thuộc danh mục cho phép (`.pdf` cho bản chính).

## 6. Hướng dẫn Bảo trì & Debug

- **Storage:** File lưu tại `uploads/deployments/{deploymentId}/`. Có thể cấu hình lại path qua biến môi trường.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 9 (Multer config, Auto-create logic, Progress calculation, DocUpload UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
