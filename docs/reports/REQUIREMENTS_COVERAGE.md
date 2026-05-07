# Báo Cáo Bao Phủ Yêu Cầu (Requirements Coverage Report)

Tài liệu này ánh xạ các User Story trong `AGILE_REQUIREMENTS.md` với các Sprint Report tương ứng để đảm bảo toàn bộ đặc tả hệ thống đã được thiết kế và triển khai đầy đủ qua các giai đoạn.

## 🎯 Epic 0: Xác thực & Quản lý người dùng (Auth & RBAC)
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-0.1** | Đăng nhập Local | [Sprint 00](sprint-00-bootstrap.md), [Sprint 01](sprint-01.md) | ✅ DONE |
| **US-0.2** | Xác thực Microsoft 365 (SSO) | [Sprint 11](sprint-11.md) | ✅ DONE |
| **US-0.3** | Quản lý Token (Refresh & Revoke) | [Sprint 00](sprint-00-bootstrap.md) | ✅ DONE |
| **US-0.4** | Phân quyền qua Nhóm (RBAC) | [Sprint 02](sprint-02.md) | ✅ DONE |

## 🧩 Epic 1: Quản lý Module cấu hình (Module Management)
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-1.1** | Quản lý bật/tắt Module | [Sprint 03](sprint-03.md) | ✅ DONE |

## 🖥️ Epic 2: Quản lý Hạ tầng & Linh kiện (Server & Hardware)
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-2.1** | Quản lý Vòng đời Server (Inventory) | [Sprint 04](sprint-04.md), [Sprint 17](sprint-17.md) | ✅ DONE |
| **US-2.2** | Theo dõi Lịch sử Cài đặt OS | [Sprint 15](sprint-15.md) | ✅ DONE |

## 🌐 Epic 3: Quản lý Mạng & Firewall (Network Zone & Firewall)
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-3.1** | Quản lý Cấu hình IP và Domain | [Sprint 05](sprint-05.md) | ✅ DONE |
| **US-3.2** | Quản lý Phân vùng mạng (Network Zone) | [Sprint 20](sprint-20.md) | ✅ DONE |
| **US-3.3** | Quản lý Luật Tường lửa (Firewall Rules) | [Sprint 19](sprint-19.md) | ✅ DONE |

## 📦 Epic 4: Quản lý Catalog Ứng dụng & Triển khai
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-4.1** | Unified Application Catalog | [Sprint 06](sprint-06.md) | ✅ DONE |
| **US-4.2** | Quản lý Bản ghi Triển khai (App Deployments)| [Sprint 06](sprint-06.md), [Sprint 08](sprint-08.md), [Sprint 18](sprint-18.md) | ✅ DONE |

## 🕸️ Epic 5: Topology 2D & Tương tác Kiến trúc
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-5.1** | Sơ đồ Mạng lưới Tương tác | [Sprint 14](sprint-14.md) | ✅ DONE |
| **US-5.2** | Kiểm tra Sức khoẻ Kết nối | [Sprint 08](sprint-08.md), [Sprint 14](sprint-14.md) | ✅ DONE |

## 📜 Epic 6: Audit Log & Lịch sử thay đổi
| User Story | Tên chức năng | Sprint Triển Khai | Trạng thái |
|---|---|---|---|
| **US-6.1** | Ghi nhận Dấu vết Thao tác (Audit Trail) | [Sprint 10](sprint-10.md) | ✅ DONE |
| **US-6.2** | Theo dõi Lịch sử Thay đổi (Change History) | [Sprint 11](sprint-11.md), [Sprint 21](sprint-21.md) | ✅ DONE |

---
**Tổng kết:** Tất cả 16 User Stories thuộc 7 Epics đều đã được lập bản đồ đầy đủ vào hệ thống Sprint (từ Sprint 00 đến Sprint 23). Đây là tài liệu phục vụ việc đối chiếu kết quả bàn giao và Tracking tiến độ QA/Testing.
