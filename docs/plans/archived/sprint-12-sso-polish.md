# Kế hoạch triển khai — Sprint 12: Polish, Performance & SSO

**Dự án:** SystemManager  
**Mục tiêu:** Cải tiến UI/UX (Polish), tối ưu hóa hiệu năng (Performance), tích hợp đăng nhập Microsoft 365 SSO và hoàn thiện các tính năng Import CSV/Excel tổng hợp, Global Search, Dark Mode.

---

## 1. Thành phần Backend ([BE])

### 1.1. Tích hợp Microsoft 365 SSO (Azure AD)
- **Cơ chế:** Sử dụng Passport OIDC (`passport-azure-ad` hoặc `passport-openidconnect`) để xác thực qua Microsoft 365. Cấu hình bảo mật qua Azure AD tenant.
- **Account Linking:** Logic cho phép ghép nối (merge) tài khoản SSO vừa đăng nhập với tài khoản local (dựa trên email hoặc UPN). Tự động tạo user mới nếu chưa tồn tại trong hệ thống.
- **Bảo mật:** Trả về access_token JWT chuẩn của hệ thống sau khi quá trình OIDC callback thành công, tích hợp vào hệ thống Authentication có sẵn.

### 1.2. Bulk Import (CSV/Excel)
- **Chức năng:** Mở rộng tính năng Import từ Sprint 9. Cho phép import hàng loạt cho các đối tượng cốt lõi: Server, Application, Deployment. Hỗ trợ đọc đa định dạng file Excel `.xlsx` và `.csv`.
- **Validation:** Bổ sung logic kiểm tra trùng lặp (IP, Port, Mã Server) cực kỳ chặt chẽ trước khi ghi dữ liệu.

### 1.3. Alert & Notification System
- **Chức năng:** Chạy background job (Cron/Scheduler) kiểm tra các hệ điều hành đã hết hạn hỗ trợ (End-of-support), tình trạng xung đột Port trong hệ thống.
- **API:** Cung cấp endpoint báo cáo các alert cho Dashboard nhằm thông báo sớm cho system admin.

---

## 2. Thành phần Frontend ([FE])

### 2.1. SSO & Authentication UI
- **Trang Đăng nhập:** Thêm hiển thị nút "Đăng nhập với Microsoft 365".
- **Callback Page:** Xử lý luồng đợi quá trình SSO callback, lưu JWT token, và thực hiện redirect tự động vào trang chính (Dashboard).

### 2.2. Polish UI: Dashboard, Global Search, Dark mode
- **Dashboard Widgets:** Cập nhật nội dung Dashboard hiển thị các cảnh báo (OS End-of-support) và phần tóm tắt những thay đổi hạ tầng mới nhất (Recent changes summary).
- **Global Search:** Tích hợp thanh tìm kiếm toàn cục (Omnibar) ngay trên Header, cho phép người dùng tra cứu Server, App, hay Network thông qua tên, IP hoặc domain. Trả về kết quả autocomplete/dropdown nhanh.
- **Dark Mode:** Bổ sung chức năng Toggle chuyển đổi giao diện Light/Dark mode trên Header, thay đổi toàn bộ variable CSS (dựa trên Ant Design Theme).

### 2.3. CSV/Excel Import UI 
- **Quy trình hoàn thiện:** Áp dụng luồng upload đa bước (Upload File → Preview Dữ Liệu/Validation → Confirm & Start Import). Xử lý UX mượt mà khi import lượng lớn data.

---

## 3. Thành phần Integration / Test ([INT])

### 3.1. Performance Testing
- **Chỉ tiêu:** Đảm bảo toàn bộ các API đạt response time < 500ms; Graph Topology 3D/2D render dứt điểm trong vòng < 2s. Sử dụng công cụ load test chuyên dụng (Artillery/k6).
- Cân nhắc áp dụng caching/tối ưu Prisma Query để đạt chuẩn này.

### 3.2. E2E Playwright Suite
- **Kiểm thử tự động:** Xây dựng tập kịch bản cho luồng Auth, Setup Wizard ban đầu, quy trình tạo/sửa đổi Server & App, và quá trình xem báo cáo Topology. Tích hợp chạy trên hệ thống CI.

---

## 4. Chi tiết tác vụ & Danh sách File tác động

### TASK 1 — [BE] Microsoft 365 SSO & Account Linking
- **File:** `packages/backend/src/modules/auth/strategies/oidc.strategy.ts` (new)
- **File:** `packages/backend/src/modules/auth/auth.controller.ts` (Bổ sung endpoint `/auth/ms365` và `/auth/ms365/callback`)
- **File:** `packages/backend/src/modules/auth/auth.service.ts` (Bổ sung hàm bind/merge SSO account và khởi tạo token).

### TASK 2 — [BE] Import CSV/Excel Data Mappers
- **File:** `packages/backend/src/modules/import/import.service.ts` (Logic parse `.xlsx` với thư viện `exceljs` hoặc `xlsx`).

### TASK 3 — [BE] Alerting & Notifications End-of-support
- **File:** `packages/backend/src/modules/alert/alert.module.ts` (new)
- Sử dụng gói CRON Job `@nestjs/schedule` để thiết lập cơ chế quét định kỳ.

### TASK 4 — [FE] SSO Callback & Login UI
- **File:** `packages/frontend/src/pages/auth/LoginPage.tsx` (Thêm Social Auth provider block)
- **File:** `packages/frontend/src/pages/auth/AuthCallbackPage.tsx` (new)

### TASK 5 — [FE] Global Search & Dark Mode Toggle
- **File:** `packages/frontend/src/components/layout/Header.tsx` (Render thanh Omnibar và nút mode switch)
- **File:** `packages/frontend/src/theme/darkAlgorithm.ts` (hoặc tích hợp custom token ConfigProvider của Ant Design)

### TASK 6 — [FE] Dashboard Warnings 
- **File:** `packages/frontend/src/pages/dashboard/DashboardPage.tsx`
- **File:** `packages/frontend/src/pages/dashboard/components/AlertPanel.tsx` (new)

### TASK 7 — [INT] E2E & Perf Test Scripts
- **File:** `packages/e2e/playwright.config.ts` (new project folder)
- **File:** `packages/e2e/tests/*.spec.ts`

---

## 5. Danh sách Story Points (Tổng kết)

| Task ID | Nội dung phân việc | Points | Role |
|---|---|:---:|:---:|
| **S12-01** | `[BE]` Microsoft 365 SSO (Passport OIDC + Azure AD) | 8 | BE |
| **S12-02** | `[BE]` Account linking: merge SSO user với existing local account | 5 | BE |
| **S12-03** | `[BE]` Import CSV/Excel: server, application, deployment bulk import | 8 | BE |
| **S12-04** | `[BE]` Alert & Notification: OS end-of-support alert, port conflict alert | 5 | BE |
| **S12-05** | `[FE]` SSO login button + callback page | 3 | FE |
| **S12-06** | `[FE]` Dashboard: OS end-of-support warnings, recent changes summary | 5 | FE |
| **S12-07** | `[FE]` Global search (server/app/network by name/IP/domain) | 5 | FE |
| **S12-08** | `[FE]` Dark mode toggle | 2 | FE |
| **S12-09** | `[FE]` CSV import UI (upload → preview → confirm) | 5 | FE |
| **S12-10** | `[INT]` Performance testing: API < 500ms, topology < 2s | 3 | INT |
| **S12-11** | `[INT]` Full E2E Playwright suite: auth, admin, server, app, topology | 8 | INT |

**Tổng Sprint 12: 57 Story Points**

---

## 6. Tài liệu tham khảo
- **SRS Section:** 4.0.1, 4.0b, 5, 6
- **TASKS.md:** Hạng mục S12 (Sprint 12)
- **Mã nguồn liên quan sẵn có:** Auth module (đã hỗ trợ thao tác Login/JWT), Module Import CSV System (từ Sprint 9).

---

_Kế hoạch được soạn thảo bởi: Kilo Agent_  
_Ngày cập nhật: 2026-04-21_
