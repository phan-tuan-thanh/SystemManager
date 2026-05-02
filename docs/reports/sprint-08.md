# Sprint 08 — Quản lý Kết nối & Port Mapping

**Ngày bắt đầu:** 2026-04-25  
**Ngày kết thúc:** 2026-04-27  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý các cổng dịch vụ (Ports) của ứng dụng trên server và các quan hệ kết nối Upstream/Downstream giữa các ứng dụng.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **Model: Port**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `port_number` | `Int` | Số hiệu cổng (VD: 8080) | Required |
| `protocol` | `String` | Giao thức (`TCP`, `UDP`) | Default: `TCP` |
| `service_name` | `String` | Tên dịch vụ (VD: 'api-gateway') | |

#### **Model: AppConnection**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `source_app_id` | `UUID` | Ứng dụng gọi (Source) | Foreign Key |
| `target_app_id` | `UUID` | Ứng dụng được gọi (Target) | Foreign Key |
| `connection_type`| `Enum` | Loại (`HTTP`, `GRPC`, `DB`) | |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Connection Logic)
- **Port Conflict Detection:** Khi đăng ký một Port cho một Deployment, hệ thống kiểm tra xem trên Server đó đã có ứng dụng nào khác chiếm dụng cặp `Port + Protocol` này chưa.
- **Dependency Analysis:** Cung cấp API trả về danh sách phân cấp các ứng dụng phụ thuộc (Downstream) và các ứng dụng đang phụ thuộc vào ứng dụng hiện tại (Upstream).

### 3.2. Tầng Frontend (Visual Connections)
- **Dependency Tab:** Trong trang chi tiết Ứng dụng, hiển thị sơ đồ cây đơn giản cho các kết nối trực tiếp.
- **Port Management:** Danh sách các Port được hiển thị kèm theo nhãn giao thức màu sắc khác nhau để dễ nhận diện.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/ports` | `POST` | Mở port cho ứng dụng | `OPERATOR` |
| `/applications/:id/dependencies` | `GET` | Phân tích quan hệ kết nối | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 18
- Tasks: 7 (Port Schema, Connection logic, Dependency UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
