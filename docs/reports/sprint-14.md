# Sprint 14 Report — UX Polish & Floating Filters

**Ngày bắt đầu:** 2026-04-23  
**Ngày kết thúc:** 2026-04-23 (Early Completion)  
**Sprint Goal:** Cải thiện trải nghiệm người dùng trên trang Topology bằng cách chuyển bộ lọc sang dạng thanh ngang (Floating Bar) luôn hiển thị ở top view, đồng bộ bộ lọc trên tất cả engine 2D/3D và cải thiện phân biệt thị giác giữa các node.  
**Trạng thái:** ✅ DONE

---

## Sprint Goal

> Sau Sprint 14, người dùng có thể truy cập bộ lọc môi trường và loại node ngay cả khi đang ở chế độ toàn màn hình (Fullscreen). Giao diện bộ lọc đồng nhất trên mọi engine (ReactFlow, Cytoscape, Vis-network, 3D). Các node Server và Application được phân biệt rõ ràng hơn qua hình dạng và màu sắc.

---

## Planned Tasks

| # | Task | Points | Status |
|---|---|---|---|
| S14-01 | `[FE]` Refactor `TopologyFilterPanel` sang giao diện thanh ngang (Horizontal Bar) | 3 | ✅ |
| S14-02 | `[FE]` Di chuyển `TopologyFilterPanel` ra ngoài engine-specific blocks | 2 | ✅ |
| S14-03 | `[FE]` Set `vis-network` làm engine mặc định và tối ưu z-index | 1 | ✅ |
| S14-04 | `[FE]` Cải thiện phân biệt thị giác giữa Server và App nodes | 3 | ✅ |
| S14-05 | `[FE]` Tối ưu logic Auto Arrange cho các node không có kết nối | 3 | ✅ |

**Planned Velocity:** 12 points  
**Actual Velocity:** 12 points

---

## Thành phần đã triển khai

### Frontend (UI/UX)

#### S14-01+02 — Floating Horizontal Filters
- **Refactor**: `TopologyFilterPanel` được thiết kế lại thành một thanh ngang nổi (Floating Bar) nằm ở top giữa của màn hình.
- **Tính nhất quán**: Bộ lọc được di chuyển lên component cha (`TopologyPage`), dữ liệu lọc được truyền xuống các engine con qua props. Điều này giúp bộ lọc luôn khả dụng ngay cả khi engine thay đổi hoặc đang ở chế độ Fullscreen.
- **Ant Design Popups**: Sử dụng `getPopupContainer` để đảm bảo menu Select hiển thị đúng khi fullscreen.

#### S14-03 — Vis-network Default Engine
- **Mặc định**: Chuyển đổi engine mặc định từ React Flow sang Vis-network do khả năng xử lý đồ thị lớn và layout mượt mà hơn.
- **Z-Index**: Điều chỉnh z-index của bộ lọc lên 1000 để không bị che khuất bởi các phần tử đồ họa.

#### S14-04 — Visual Node Distinction
- **Server Nodes**: Sử dụng hình chữ nhật bo góc với viền đậm (stroke) để thể hiện sự vững chãi của hạ tầng.
- **App Nodes**: Sử dụng hình viên thuốc (pill shape) với gradient màu sắc theo loại ứng dụng (System vs Business) để dễ phân biệt.

#### S14-05 — Compact Layout for Disconnected Nodes
- **Cải tiến**: Các node không có quan hệ (disconnected) không còn bị dàn hàng ngang/dọc quá dài. Thay vào đó, chúng được gom lại thành các khối nhỏ gọn trong khung nhìn, tương tự như cách xử lý của Vis-network.

---

## Achievements

- [x] Bộ lọc luôn hiển thị và hoạt động tốt trong chế độ Fullscreen.
- [x] Giao diện đồng nhất trên tất cả 4 engine (ReactFlow, Cytoscape, Vis-network, 3D).
- [x] Phân biệt rõ ràng giữa Server và Application trên sơ đồ.
- [x] Tối ưu hóa không gian cho các node rời rạc.
- [x] 12/12 story points hoàn thành trong ngày.

---

## Metrics

| Metric | Planned | Actual |
|---|---|---|
| Story Points | 12 | 12 |
| Tasks Completed | 5 | 5 |
| New Files Created | 0 | 0 |
| Files Modified | 4 | 4 |

---

## Retrospective

### What went well
- Việc di chuyển state bộ lọc lên cha giúp code sạch hơn và giải quyết triệt để vấn đề mất đồng bộ giữa các view.
- Floating bar mang lại cảm giác hiện đại và tiết kiệm diện tích hơn so với Sidebar panel cũ.

### What could be improved
- Cần kiểm tra kỹ hơn độ tương phản của nhãn văn bản trên các node có gradient màu sáng.

---

## Next Steps
- Bắt đầu **Sprint 15**: Tập trung vào logic Import Server chi tiết (OS, Hardware) và đơn giản hóa quy trình upload.

---

_Report tạo bởi: Antigravity AI Agent_  
_Cập nhật lần cuối: 2026-04-24_
