# Sprint XX — [Tên Sprint / Module]

**Ngày bắt đầu:** YYYY-MM-DD  
**Ngày kết thúc:** YYYY-MM-DD  
**Trạng thái:** PLANNED / IN PROGRESS / DONE  
**PR Link:** [#PR_NUMBER](https://github.com/...)

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> [Mô tả mục tiêu của Sprint. Các tính năng/nghiệp vụ nào được giải quyết? Trị giá của tính năng này đối với toàn bộ hệ thống là gì?]

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

Phần này mô tả cấu trúc dữ liệu, các hằng số (Constants), Options và các trường dữ liệu (Fields) trong Database/DTO giúp Agent hiểu rõ cấu trúc mà không cần đọc schema.

#### **Model / DTO: [Tên Model hoặc DTO]**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `field_name` | `String` | Mô tả chi tiết | `Unique`, `Required`, `maxLength(255)` |
| `status` | `Enum` | Các Option trạng thái | `ACTIVE`, `INACTIVE` (Default: `ACTIVE`) |

#### **Hằng số & Enums (Constants & Options)**
- `ENUM_NAME`: [Giải thích ý nghĩa các options]
- `CONSTANT_NAME`: [Mô tả ý nghĩa hằng số trong code]

## 3. Luồng xử lý kỹ thuật & Business Logic

Phần này đặc tả chi tiết logic bên trong code cho cả Backend và Frontend, giúp Agent theo dõi và debug dễ dàng.

### 3.1. Tầng Backend (Server-side Logic)
- **[Tên logic 1 - VD: Transaction Logic]:** Mô tả chi tiết cách xử lý đồng bộ dữ liệu. Khi nào commit, khi nào rollback.
- **[Tên logic 2 - VD: Validation Rules]:** Các logic validate nghiệp vụ (Ví dụ: Không cho phép trùng IP trong cùng Environment).
- **[Cơ chế đặc thù]:** (VD: Regex Parsing, In-memory Session, Caching, Recursive Dependency check).

### 3.2. Tầng Frontend (Client-side Logic)
- **[Tên workflow - VD: Multi-step Wizard]:** Mô tả các bước tương tác UI (Ví dụ: Step 1 -> Upload, Step 2 -> Map cột).
- **State Management:** Cách quản lý state (VD: Dùng Zustand persist, cache TanStack Query).
- **Dynamic UI / Interaction:** Tương tác UI phức tạp (VD: Kéo thả ReactFlow, Ẩn/hiện trường động dựa trên Enum).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/resource` | `POST` | Mô tả chức năng API | `ADMIN`, `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

Các case lỗi thường gặp, logic chặn lỗi và cách hệ thống/UI hiển thị cho người dùng:

- **Conflict Data (Lỗi 409):** Ví dụ: Tạo trùng Port/IP -> Ném `ConflictException`, UI hiển thị thông báo lỗi bằng Notification màu đỏ.
- **Forbidden Action (Lỗi 403):** Người dùng VIEWER cố gắng thao tác POST -> Guard chặn lại.
- **Ngoại lệ FE:** Global Error Boundary bắt lỗi crash UI và log về Server (ClientLog).

## 6. Hướng dẫn Bảo trì & Debug

- **Log & Trace:** Thao tác này có được Audit Log ghi lại không?
- **Gotchas / Chú ý:** Khi chỉnh sửa code phần này trong tương lai cần lưu ý điểm gì? (VD: Nhớ cập nhật Constants nếu thêm Option mới).

---

## 7. Metrics & Tasks

- Story Points: XX
- Tasks: X (Tóm tắt các đầu việc đã làm)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: YYYY-MM-DD_
