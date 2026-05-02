# Sprint 18 — Multi-port Import & Regex Parsing

**Ngày bắt đầu:** 2026-05-25  
**Ngày kết thúc:** 2026-05-27  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Nâng cấp khả năng nhập liệu Deployment hỗ trợ nhiều cổng dịch vụ (Multi-port) thông qua kỹ thuật bóc tách chuỗi phức tạp.

## 2. Đặc tả dữ liệu (Data Formats)

#### **Multi-port String Format**
- **Pattern:** `PORT-PROTOCOL:SERVICE_NAME` (Cách nhau bởi dấu cách)
- **Ví dụ:** `8080-TCP:api-gateway 9092-TCP:kafka-broker 443-HTTPS:web-ui`

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Regex Parsing Engine)
- **Complex String Parsing:** Backend sử dụng Regular Expression (`Regex`) để bóc tách chuỗi Port. 
  - Regex: `/(\d+)-(TCP|UDP|HTTPS|GRPC):?([^\s]*)/g`
- **Data Transformation:** Chuỗi thô từ CSV được chuyển đổi thành mảng các Object `Port` tương ứng. Sau đó, hệ thống thực hiện vòng lặp để tạo hàng loạt bản ghi trong bảng `Port` và liên kết chúng với bản ghi `AppDeployment` vừa tạo.

### 3.2. Tầng Frontend (Import Consolidation)
- **Unified Import Page:** Hợp nhất 3 trang upload riêng lẻ (App, Deployment, Connection) vào một trang duy nhất sử dụng Tab.
- **Value Mapping UI:** Khi import Ứng dụng, hệ thống cho phép người dùng ánh xạ các giá trị Alias (VD: trong CSV là 'UAT1' nhưng trong DB là 'UAT').

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/import/preview?type=deployment` | `POST` | Preview kèm bóc tách port | `OPERATOR` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Regex parsing, Unified UI, Alias mapping)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
