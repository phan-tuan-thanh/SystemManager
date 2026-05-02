# Sprint 11 — Microsoft 365 SSO Integration

**Trạng thái:** ✅ DONE  

---

## 1. Tổng quan & Mục tiêu (Sprint Goal)
> Tích hợp đăng nhập một chạm Single Sign-On (SSO) sử dụng Azure AD / Microsoft 365, giúp tiện lợi cho người dùng nội bộ.

## 2. Kiến trúc & Schema Database
- **User Model Update:** Thêm trường `ms365_id` để mapping với tài khoản bên Azure.

## 3. Luồng xử lý kỹ thuật & Business Logic
- **OAuth2 Flow:** Sử dụng `passport-azure-ad` hoặc MSAL. Client lấy Token từ Azure, truyền lên Backend. Backend verify chữ ký JWT của Microsoft.
- Nếu email đã tồn tại trong local DB, hệ thống tự động link account. Nếu chưa, hệ thống tự động tạo User mới (Auto-provisioning).

---
## 7. Metrics & Tasks
_Hoàn thiện luồng SSO M365._
