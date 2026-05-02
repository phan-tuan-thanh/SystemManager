# Sprint 15 — Vòng đời Hệ điều hành (OS Lifecycle)

**Ngày bắt đầu:** 2026-05-13  
**Ngày kết thúc:** 2026-05-15  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Quản lý lịch sử cài đặt, nâng cấp và thay thế hệ điều hành (OS) trên từng Server.

## 2. Đặc tả các trường dữ liệu (Data Fields & Structures)

#### **Model / DTO: ServerOsInstall**
| Field | Type | Description | Constraints / Validation |
|---|---|---|---|
| `version` | `String` | Phiên bản OS | `VarChar(100)` |
| `installed_at` | `DateTime` | Ngày cài đặt | `Required` |
| `replaced_at` | `DateTime` | Ngày thay thế | `Nullable` |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Server-side Logic)
- **Current OS Pointer:** Khi tạo mới bản ghi install, hệ thống tự động cập nhật `replaced_at` cho bản ghi cũ và trỏ `current_os_install_id` của Server về bản ghi mới.

### 3.2. Tầng Frontend (Client-side Logic)
- **Timeline View:** Hiển thị lịch sử OS qua AntD Timeline.

## 4. Đặc tả API Interfaces

### 4.1. Backend Endpoints
| Endpoint | Method | Chức năng chính | Quyền hạn (Roles) |
|---|---|---|---|
| `/api/v1/servers/:id/os-installs` | `GET` | Lịch sử OS của server | `VIEWER` |
| `/api/v1/servers/:id/os-installs` | `POST` | Ghi nhận cài đặt mới | `OPERATOR` |

### 4.2. Frontend Services / Hooks
| Hook / Service | API Tương ứng | Chức năng chính |
|---|---|---|
| `useServers()` | N/A | Hook tích hợp quản lý vòng đời OS. |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling & Edge Cases)

- **Invalid Date Order:** Ngày thay thế không được trước ngày cài đặt.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (OS Schema, Transition logic, Timeline UI)

_Tài liệu kỹ thuật chuẩn PROD (Agent-Ready) - Cập nhật ngày: 2026-05-02_
