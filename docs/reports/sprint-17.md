# Sprint 17 — Deployment Upload UI (Wizard) & Port Conflict Guard

**Ngày bắt đầu:** 2026-05-09  
**Ngày kết thúc:** 2026-05-10  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Chuyên nghiệp hóa quy trình nhập liệu ứng dụng triển khai (Deployment) thông qua giao diện Wizard 4 bước. Tích hợp cơ chế bảo vệ, ngăn chặn xung đột cổng dịch vụ (Port Conflict) trên cùng một máy chủ vật lý/ảo.

## 2. Kiến trúc & Logic Phân tích (Architecture)

- **Import Session Management:** Sử dụng `importSessions` (In-memory Map) để lưu trữ kết quả validate tạm thời trong 30 phút, giúp giảm tải truy vấn lặp lại giữa bước Preview và Execute.
- **Port Management:** Tách biệt bảng `Port` khỏi bảng `AppDeployment` để hỗ trợ một ứng dụng chạy trên nhiều port khác nhau.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Quy trình Wizard 4 bước (Frontend & Backend)
1. **Upload:** Người dùng tải file CSV lên. Backend parse và trả về `sessionId`.
2. **Mapping:** Backend tự động ánh xạ tiêu đề cột (Aliases). VD: `ten_dich_vu` -> `service_name`.
3. **Preview:** Hiển thị danh sách dòng hợp lệ và dòng lỗi. Người dùng kiểm tra trước khi xác nhận.
4. **Execute:** Backend thực hiện `upsert` dữ liệu dựa trên `sessionId`.

### 3.2. Chống trùng Port (Conflict Guard)
- **Logic:** Khi import Deployment kèm thông tin Port:
  - Hệ thống kiểm tra trong Database: Đã có ứng dụng nào (khác ứng dụng đang import) chiếm dụng Port + Protocol này trên cùng một Server đó chưa?
  - Nếu có, hệ thống ném lỗi ngay lập tức trong quá trình Import để người dùng điều chỉnh.

### 3.3. Xử lý Port lồng nhau
- Hỗ trợ gán nhiều Port cho một bản triển khai duy nhất thông qua quan hệ 1-n giữa `AppDeployment` và `Port`.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/import/preview` | `POST` | Parse file & lấy SessionId | `OPERATOR` |
| `/import/execute` | `POST` | Thực thi import từ Session | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Session Expired:** Trả về `404 Not Found` nếu người dùng để trang Preview quá lâu ( > 30 phút) mà không bấm Execute.
- **Header Alias:** Hệ thống hỗ trợ hàng chục tên gọi khác nhau cho cùng một cột dữ liệu, giúp giảm bớt việc chỉnh sửa file Excel thủ công.

## 6. Hướng dẫn Bảo trì & Debug

- **Memory:** Vì `importSessions` lưu trong RAM, nếu restart server trong khi đang import, session sẽ bị mất và user cần upload lại file.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Import Wizard UI, Session Manager, Port conflict logic, Header Alias mapping)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
