# Task List: Sprint 15 — Server Import & Data Enrichment

Dựa trên kế hoạch tại [implementation_plan.md](implementation_plan.md).

## Phase 1: Database & Backend Infrastructure
- [ ] **S15-01** `[BE]` Thêm trường `os` vào model `Server` trong `schema.prisma` (VarChar 255)
- [ ] **S15-02** `[BE]` Chạy migration để cập nhật database: `/gen-migration add os field to server`
- [ ] **S15-03** `[BE]` Cập nhật `CreateServerDto` và `UpdateServerDto` để bao gồm trường `os`
- [ ] **S15-04** `[BE]` Cập nhật `ServerService`: Đảm bảo các hàm CRUD (`create`, `update`, `findOne`) xử lý đúng trường `os`
- [ ] **S15-05** `[BE]` Cập nhật `ImportService`:
    - [ ] Mapping cột `OS` từ CSV vào trường `server.os` thay vì nối vào `description`
    - [ ] Kiểm tra và chuẩn hóa logic parse `cpu`, `ram`, `total_storage_gb` vào `HardwareComponent.specs`

## Phase 2: Frontend Simplified Import & Navigation
- [ ] **S15-06** `[FE]` Cập nhật `Sidebar.tsx`: Đổi tên menu `/infra-upload` từ "Upload" thành **"Upload Server"**
- [ ] **S15-07** `[FE]` Tinh chỉnh trang `InfraUploadPage` (`infra-upload/index.tsx`):
    - [ ] Gỡ bỏ `Segmented` control (chọn loại import)
    - [ ] Thiết lập mặc định `importType` là `server`
    - [ ] Loại bỏ mã nguồn và UI liên quan đến import hạ tầng (`infra`)
    - [ ] Cập nhật tiêu đề trang thành **"Upload Server"**

## Phase 3: UI/UX Enrichment (OS & Hardware Details)
- [ ] **S15-08** `[FE]` Cập nhật `types/server.ts`: Thêm trường `os` vào interface `Server`
- [ ] **S15-09** `[FE]` Cập nhật `ServerDetailPage`: Hiển thị thông tin **"Hệ điều hành"** trong tab thông tin chung (Info)
- [ ] **S15-10** `[FE]` Cập nhật `HardwareTab.tsx`:
    - [ ] Thêm cột **"Thông số" (Specs)** vào bảng phần cứng
    - [ ] Hiển thị chi tiết số nhân (Cores) cho CPU, dung lượng (GB) cho RAM/HDD từ trường `specs`
- [ ] **S15-11** `[FE]` Cập nhật `ServerForm.tsx`: Thêm trường nhập liệu **"Hệ điều hành"** vào form tạo/sửa server

## Phase 4: Quality Assurance & Verification
- [ ] **S15-12** `[INT]` Kiểm tra quy trình Import với file mẫu: Xác nhận OS và Phần cứng được lưu đúng
- [ ] **S15-13** `[FE]` Kiểm tra hiển thị trên giao diện: Đảm bảo các thông số kỹ thuật hiển thị trực quan và chính xác
