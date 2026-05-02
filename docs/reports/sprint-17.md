# Sprint 17 — Wizard Import & Quản lý Phiên dữ liệu

**Ngày bắt đầu:** 2026-05-22  
**Ngày kết thúc:** 2026-05-24  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Triển khai quy trình nhập dữ liệu hàng loạt (Bulk Import) thông qua Wizard 4 bước với khả năng xem trước và sửa lỗi trực tiếp.

## 2. Đặc tả dữ liệu (Data Structures)

#### **Import Preview DTO**
| Field | Type | Description |
|---|---|---|
| `session_id` | `String` | ID phiên làm việc tạm thời |
| `total_rows` | `Int` | Tổng số dòng trong file |
| `valid_rows` | `Object[]` | Danh sách các dòng hợp lệ |
| `invalid_rows` | `Object[]` | Danh sách các dòng có lỗi kèm lý do |
| `mapping` | `Object` | Ánh xạ cột CSV -> Trường DB |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (In-memory Session Management)
- **Temporary Storage:** Khi upload file, Backend không ghi ngay vào DB chính mà lưu dữ liệu vào một **SessionMap** trong bộ nhớ (hoặc Redis). Session này có thời hạn sống (`TTL`) là 10 phút.
- **Transactional Execution:** Khi người dùng nhấn "Xác nhận", toàn bộ danh sách `valid_rows` được thực thi bên trong một **Database Transaction**. Nếu một dòng bất kỳ gặp lỗi lúc ghi (VD: Database constraint), toàn bộ phiên nhập sẽ bị Rollback để đảm bảo sạch dữ liệu.

### 3.2. Tầng Frontend (Multi-step Wizard)
- **Step 1: Upload:** Kéo thả file CSV/XLSX.
- **Step 2: Mapping:** Tự động gợi ý ánh xạ cột dựa trên tiêu đề file (Header Aliases). Người dùng có thể chỉnh sửa lại thủ công.
- **Step 3: Preview & Edit:** Hiển thị bảng dữ liệu xem trước. Các ô có dữ liệu lỗi (VD: sai định dạng IP) được tô đỏ và cho phép **Sửa trực tiếp (Inline Edit)** ngay trên bảng.
- **Step 4: Result:** Hiển thị kết quả nhập thành công/thất bại sau khi xử lý.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/import/preview` | `POST` | Upload & Validate sơ bộ | `OPERATOR` |
| `/import/execute` | `POST` | Ghi dữ liệu chính thức | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Import Service, Session logic, 4-step UI wizard)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
