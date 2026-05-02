# Sprint 08 — Phân tích Phụ thuộc & Kết nối Ứng dụng

**Ngày bắt đầu:** 2026-04-21  
**Ngày kết thúc:** 2026-04-22  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Xây dựng cơ sở dữ liệu về mối quan hệ giữa các ứng dụng (Application Dependencies). Đây là dữ liệu đầu vào cốt lõi để vẽ sơ đồ Topology và phân tích ảnh hưởng (Impact Analysis).

## 2. Kiến trúc & Schema Database (Architecture)

- **Model `AppConnection`:** Lưu ứng dụng nguồn (`source`), ứng dụng đích (`target`) và port đích.

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Tầng Backend (Dependency Analysis Logic)
- **Upstream/Downstream logic:** Backend tính toán các mối quan hệ "Phụ thuộc vào" và "Được phụ thuộc bởi" theo môi trường.
- **Self-loop Protection:** Chặn logic tạo kết nối tới chính mình tại tầng Service.
- **Port Mapping:** Khi tạo kết nối, hệ thống kiểm tra `target_port_id` có thực sự thuộc về Ứng dụng đích đã chọn hay không.

### 3.2. Tầng Frontend (Dependency UI)
- **Chế độ xem Tập trung (Focus View):** Trong màn hình chi tiết Ứng dụng, hệ thống hiển thị danh sách các kết nối dưới dạng Table hoặc Tab phụ thuộc.
- **Form Tạo kết nối:** Sử dụng Select Search để tìm nhanh Ứng dụng Nguồn/Đích. UI tự động lọc danh sách Port khả dụng của Ứng dụng đích sau khi người dùng chọn App.
- **Trực quan hoá:** Sử dụng các nhãn màu sắc (Tag) để phân biệt loại kết nối (VD: `SYNC` - Xanh, `ASYNC` - Cam).

## 4. Đặc tả API Interfaces

| Endpoint | Method | Chức năng | Quyền |
|---|---|---|---|
| `/connections` | `POST` | Tạo kết nối (validate port/self-loop) | `OPERATOR` |
| `/connections/app/:id/deps`| `GET` | Lấy danh sách Upstream/Downstream | `VIEWER` |

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- **Foreign Key Violation:** Trả về lỗi nếu xoá App đang có kết nối hiện hữu.
- **Port Mismatch:** Frontend chặn chọn port nếu port đó không thuộc về App đích đã chọn.

## 6. Hướng dẫn Bảo trì & Debug

- **Topology Input:** Bảng này là nguồn dữ liệu thô (Single source of truth) duy nhất cho module Topology.

---

## 7. Metrics & Tasks

- Story Points: 15
- Tasks: 6 (Connection Schema, Dependency logic, Validation rules, Upstream/Downstream API)

_Tài liệu kỹ thuật chuẩn PROD - Cập nhật ngày: 2026-05-02_
