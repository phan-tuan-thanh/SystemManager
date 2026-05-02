# Sprint 16 — Phân loại Nhóm & Hợp nhất Catalog

**Ngày bắt đầu:** 2026-05-19  
**Ngày kết thúc:** 2026-05-21  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Tái cấu trúc danh mục ứng dụng để phân biệt rõ giữa Phần mềm hệ thống (Hạ tầng) và Ứng dụng nghiệp vụ.

## 2. Đặc tả các trường dữ liệu (Data Fields)

#### **ApplicationGroup Updates**
| Field | Type | Description | Constraints |
|---|---|---|---|
| `group_type` | `Enum` | `BUSINESS` hoặc `INFRASTRUCTURE` | Required |

#### **Application Metadata (SYSTEM type)**
| Field | Type | Description |
|---|---|---|
| `sw_type` | `Enum` | `OS`, `DATABASE`, `MIDDLEWARE`, ... |
| `vendor` | `String` | Nhà sản xuất (VD: 'Canonical', 'Oracle') |
| `eol_date` | `DateTime` | Ngày hết hạn hỗ trợ chính thức |

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Catalog Unification)
- **Shared Application Base:** Thay vì quản lý `SystemSoftware` ở bảng riêng, toàn bộ được chuyển về bảng `Application` với cờ phân loại `application_type = SYSTEM`.
- **Validation Rules:** Backend kiểm tra nếu ứng dụng thuộc nhóm `INFRASTRUCTURE` thì bắt buộc phải chọn `sw_type`.

### 3.2. Tầng Frontend (Contextual Forms)
- **Dynamic Field Visibility:** Form tạo Ứng dụng tự động ẩn/hiện các trường thông tin (Vendor, EOL) dựa trên loại Ứng dụng được chọn.
- **Categorized Tabs:** Trang danh sách Ứng dụng được chia thành các Tab: "Nghiệp vụ" và "Hạ tầng" để người dùng dễ dàng quản lý theo mục đích sử dụng.

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/applications?type=SYSTEM` | `GET` | Danh sách phần mềm hệ thống | `VIEWER` |

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Schema refactor, Data migration, Dynamic UI)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
