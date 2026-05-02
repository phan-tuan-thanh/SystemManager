# Sprint 10 — Audit Logs & Dashboard Analytics

**Ngày bắt đầu:** 2026-04-30  
**Ngày kết thúc:** 2026-05-02  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng hệ thống giám sát hoạt động (Audit Logs) và hiển thị dữ liệu tổng hợp lên Dashboard trung tâm.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: AuditLog**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `action` | `Enum` | Hành động thực hiện | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`... |
| `resource_type` | `String` | Loại tài nguyên | `VarChar(100)` |
| `resource_id` | `String` | ID tài nguyên | `Nullable` |
| `old_value` | `Json` | Giá trị cũ | `Nullable` |
| `new_value` | `Json` | Giá trị mới | `Nullable` |
| `result` | `Enum` | Kết quả | `SUCCESS`, `FAILED` |

#### **Hằng số & Enums (Constants & Options)**
- `AuditAction`: Toàn bộ các hành động được định nghĩa trong `schema.prisma`.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Automatic Auditing:** Backend sử dụng `AuditInterceptor` để tự động ghi log cho các request có gắn decorator `@Audit()`.
- **CSV Streaming:** Sử dụng `fast-csv` để stream dữ liệu trực tiếp từ DB ra response HTTP nhằm tối ưu bộ nhớ khi export hàng chục ngàn bản ghi.

### 3.2. Tầng Frontend (Client-side Logic)
- **Statistic Cards:** Sử dụng hook `useSystemStatus` để fetch dữ liệu tổng quan cho trang Dashboard.
- **Audit Table:** Sử dụng hook `useAuditLogs` với cơ chế Server-side Pagination.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/audit-logs` | `GET` | Danh sách log hoạt động | `ADMIN`, `OPERATOR` |
| `/api/v1/audit-logs/export` | `GET` | Xuất file CSV (Stream) | `ADMIN`, `OPERATOR` |
| `/api/v1/system/status` | `GET` | Thống kê dashboard | `VIEWER` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useAuditLogs(params)` | `GET /api/v1/audit-logs` | Hook fetch danh sách log. |
| `useSystemStatus()` | `GET /api/v1/system/status` | Hook cung cấp data cho Dashboard. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Export Timeout:** Cấu hình timeout cho API export dài hơn bình thường để xử lý file lớn.

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Khi thêm Resource mới vào hệ thống, cần cập nhật `resource_type` tương ứng trong code ghi log.

---

## 7. Metrics & Tasks

- Story Points: 20
- Tasks: 8 (Audit Schema, Export logic, Dashboard UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
