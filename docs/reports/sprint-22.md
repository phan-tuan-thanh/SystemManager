# Sprint 22 — Topology UX: Auto-Layout Trigger, Cascade Filter & Connection Health

**Ngày bắt đầu:** 2026-04-30  
**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)

> Đưa UX của Topology lên mức hoàn thiện nhất: Sắp xếp sơ đồ tự động khi thay đổi filter, tối ưu bộ lọc đa cấp (Cascade), và xây dựng công cụ kiểm tra "Sức khoẻ kết nối" (Health Drawer) để tự động phát hiện lỗi kiến trúc hệ thống.

## 2. Kiến trúc & Schema Database

*Thuần tuý tính toán dữ liệu phía Frontend.*

## 3. Luồng xử lý kỹ thuật & Business Logic

### 3.1. Auto-Arrange Trigger (Khắc phục Stale Closure)
- **Vấn đề:** Muốn sơ đồ tự động xếp lại mỗi khi người dùng đổi filter (hướng, thuật toán), nhưng hook `useEffect` thường lưu giữ dữ liệu Nodes cũ (stale closure) gây lỗi toạ độ.
- **Giải pháp:** Sử dụng pattern `Stable Ref`. Tạo `handleAutoArrangeRef` bọc hàm sắp xếp hiện tại, và kích hoạt qua `useEffect` có dependency là `filters.layoutAlgorithm` hoặc `filters.layoutDirection`. Bỏ qua lần render đầu tiên (mount) bằng cờ `isFirstRenderRef`.

### 3.2. Connection Health Analyzer (Kiểm tra Sức khoẻ)
- Export hàm `analyzeTopologyHealth(servers, connections)` chạy hoàn toàn bằng thuật toán client-side.
- **Thuật toán quét lỗi:**
  - **Circular Dependency (Vòng lặp):** Thuật toán DFS (Depth-First Search) quét đồ thị có hướng. Nếu tìm thấy đường đi quay về node đang xét -> Cảnh báo Đỏ (ERROR).
  - **Dead Connection:** Kết nối trỏ tới một App mà trạng thái AppDeployment là `STOPPED` hoặc `INACTIVE`.
  - **Cross-Env Connection:** Môi trường Source (VD: UAT) kết nối xuống Target (VD: PROD).
  - **SPoF (Single Point of Failure):** Node có In-Degree (lượt trỏ vào) > 5.

## 4. Đặc tả API Interfaces

*Không có*

## 5. Xử lý Lỗi & Ngoại lệ (Error Handling)

- Thuật toán DFS tìm vòng lặp được viết theo dạng vòng lặp lặp (Iterative) kết hợp Stack thay vì Đệ quy (Recursive) để tránh lỗi **Stack Overflow** khi topology có hàng nghìn nodes.

## 6. Hướng dẫn Bảo trì & Debug

- Chức năng Health Analyzer phân tích dựa trên Data Model chuẩn từ API `topology(environment)` trả về. Nếu thay đổi payload GraphQL, phải cập nhật lại Type casting trong hàm phân tích này.

---

## 7. Metrics & Tasks (Lịch sử công việc)

### Danh sách Tasks
- ✅ S22-01: Auto-arrange khi thay đổi layoutAlgorithm/layoutDirection
- ✅ S22-02: Thuật toán lọc Cascade group→server→app trong FilterPanel
- ✅ S22-03: Phân tích 5 loại lỗi kiến trúc và hiển thị qua ConnectionHealthDrawer

_Tài liệu kỹ thuật chuẩn PROD - Phục vụ bàn giao và bảo trì._
