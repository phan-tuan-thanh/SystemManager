# Sprint 18 — Multi-port Import & Regex Parsing

**Ngày bắt đầu:** 2026-05-25  
**Ngày kết thúc:** 2026-05-27  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xử lý việc nhập liệu phức tạp bằng thuật toán bóc tách dữ liệu chuỗi. Hợp nhất các Wizard nhỏ lẻ thành một giao diện Import đa năng.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Hằng số & Enums (Constants & Options)**
- **Multi-port String Format:** `PORT-PROTOCOL:SERVICE_NAME` (Cách nhau bởi khoảng trắng)
- **Ví dụ chuỗi hợp lệ:** `"8080-TCP:API 443-HTTPS:UI"`

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Regex Parsing Engine:** Để import nhanh Deployment cùng lúc nhiều cổng, Backend cài đặt bộ bóc tách dùng Regular Expression: `/(\d+)-(TCP|UDP|HTTPS|GRPC):?([^\s]*)/g`.
- **Transformation Logic:** Vòng lặp bóc tách chuỗi CSV thô thành mảng các Object `Port`, sau đó gộp chung thành một mảng payload để chạy `prisma.port.createMany` trong cùng Transaction của Deployment.
- **Value Alias Handling:** Tích hợp bộ quy đổi từ khoá (`Alias`). Ví dụ user nhập môi trường là "Sản xuất" trong file CSV, backend tự động đối chiếu map thành enum `PROD`.

### 3.2. Tầng Frontend (Client-side Logic)
- **Tabbed Import Interface:** Hợp nhất 3 trang upload (App, Infra, Connections) vào một trang `/upload` với cấu trúc Tabbed, giúp luồng nghiệp vụ gọn gàng.
- **Quick Import Detection:** Bổ sung logic tự động nhận diện header CSV. Nếu file tải lên có cột header khớp chuẩn 100% với template, Frontend bỏ qua Bước 2 (Mapping) và đẩy user thẳng qua Bước 3 (Preview) để tiết kiệm thao tác.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/import/preview?type=deployment` | `POST` | Phân tích file deployment kèm regex bóc port | `OPERATOR` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Regex Mismatch (Lỗi Validation):** Một cụm string như `80X-TCP` sẽ không qua được Regex, cell đó trong bảng Preview sẽ bị mark đỏ báo lỗi "Sai định dạng Port".

## 6. Hướng dẫn Bảo trì & Debug

- **Gotchas / Chú ý:** Cẩn trọng với ký tự ngắt dòng (`\r\n`) trong ô CSV chứa chuỗi port, nó có thể làm sai kết quả quét Regex nếu không `trim()` trước khi parse.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Regex parsing, Unified UI, Alias mapping)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
