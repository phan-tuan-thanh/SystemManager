# Bảng Yêu Cầu Agile (User Stories)
Tài liệu này dịch các đặc tả kỹ thuật từ `docs/SRS.md` thành chuẩn Agile (Epic > User Story > Acceptance Criteria) để hỗ trợ quá trình phát triển, kiểm thử và theo dõi qua từng Sprint.

---

## Epic 0: Xác thực & Quản lý người dùng (Auth & RBAC)

**US-0.1: Đăng nhập Local (Local Login)**
- **As a** Người dùng hệ thống
- **I want to** Đăng nhập bằng email và mật khẩu
- **So that** Tôi có thể truy cập vào các tính năng được cấp quyền.
- **Acceptance Criteria:**
  - AC1: Nếu nhập đúng email/pass, hệ thống trả về Access Token (JWT) và Refresh Token.
  - AC2: Refresh Token phải được mã hoá (bcrypt) trước khi lưu vào database.
  - AC3: Thông tin session (IP, User Agent) được ghi vào bảng `UserLoginHistory`.

**US-0.2: Xác thực Microsoft 365 (SSO)**
- **As a** Người dùng tổ chức
- **I want to** Đăng nhập bằng tài khoản Microsoft 365 (Azure AD)
- **So that** Tôi không cần nhớ mật khẩu riêng cho hệ thống này.
- **Acceptance Criteria:**
  - AC1: Hệ thống tự động tạo User nếu email từ MS365 chưa tồn tại, hoặc liên kết (link account) nếu đã tồn tại email local.
  - AC2: Đồng bộ tên, email, avatar từ Microsoft Graph API.

**US-0.3: Quản lý Token (Refresh & Revoke)**
- **As a** Hệ thống bảo mật
- **I want to** Yêu cầu Refresh Token để lấy Access Token mới, và huỷ token cũ khi đăng xuất
- **So that** Hạn chế tối đa rủi ro lộ lọt Access Token.
- **Acceptance Criteria:**
  - AC1: API refresh token phải xác thực hash của refresh token trong database.
  - AC2: Khi gọi API `/auth/logout` hoặc đổi mật khẩu, refresh token trong DB bị set về `null`.

**US-0.4: Phân quyền qua Nhóm (RBAC via UserGroup)**
- **As a** Quản trị viên (ADMIN)
- **I want to** Gán quyền mặc định cho nhóm chức năng (UserGroup) và thêm user vào nhóm
- **So that** Tôi không phải gán quyền lắt nhắt cho từng cá nhân.
- **Acceptance Criteria:**
  - AC1: User kế thừa quyền (Union Roles) từ quyền trực tiếp và quyền mặc định của tất cả các nhóm tham gia.
  - AC2: Quyền hiệu lực được mã hoá thẳng vào JWT payload tại thời điểm đăng nhập.
  - AC3: Các thay đổi về nhóm chỉ có hiệu lực ở lần đăng nhập tiếp theo của user.

---

## Epic 1: Quản lý Module cấu hình (Module Management)

**US-1.1: Quản lý bật/tắt Module**
- **As a** Quản trị viên (ADMIN)
- **I want to** Bật hoặc tắt từng module cụ thể thông qua giao diện
- **So that** Tôi có thể ẩn các tính năng chưa cần thiết mà không cần deploy lại code.
- **Acceptance Criteria:**
  - AC1: Khi một module bị tắt (`DISABLED`), mọi endpoint API yêu cầu module đó sẽ trả về `403 Forbidden`.
  - AC2: Các module `CORE` không thể bị tắt qua UI.
  - AC3: Hệ thống phải kiểm tra dependency. Không thể bật module nếu module phụ thuộc của nó đang tắt.

---

## Epic 2: Quản lý Hạ tầng & Linh kiện (Server & Hardware)

**US-2.1: Quản lý Vòng đời Server (Server Inventory)**
- **As a** Kỹ sư hạ tầng (OPERATOR)
- **I want to** Quản lý danh sách các server ảo/vật lý cùng thông tin cấu hình (OS, CPU, RAM)
- **So that** Tôi có cái nhìn tổng quan về năng lực tính toán của toàn bộ trung tâm dữ liệu.
- **Acceptance Criteria:**
  - AC1: CRUD đầy đủ thông tin Server: hostname, purpose, environment, site, OS.
  - AC2: Hỗ trợ chức năng import hàng loạt (bulk import) từ file CSV/Excel với khả năng ánh xạ (map) tự động thông tin OS (`OS Resolution`).
  - AC3: Mọi thay đổi thông tin server đều phải được ghi log lịch sử (Change History).

**US-2.2: Theo dõi Lịch sử Cài đặt OS (OS Lifecycle)**
- **As a** Kỹ sư hệ thống (OPERATOR)
- **I want to** Quản lý lịch sử các lần cài đặt hoặc nâng cấp hệ điều hành trên một server
- **So that** Tôi biết được chu kỳ vòng đời OS và kịp thời có kế hoạch nâng cấp khi OS EOL (End-of-life).
- **Acceptance Criteria:**
  - AC1: Mỗi lần đổi OS, tạo một bản ghi `ServerOsInstall`.
  - AC2: Hiển thị tab "Vòng đời OS" trong giao diện chi tiết server.

---

## Epic 3: Quản lý Mạng & Firewall (Network Zone & Firewall)

**US-3.1: Quản lý Cấu hình IP và Domain**
- **As a** Kỹ sư mạng (OPERATOR)
- **I want to** Quản lý các IP/Domain gắn với Server
- **So that** Tôi có thể ngăn chặn tình trạng cấu hình trùng IP.
- **Acceptance Criteria:**
  - AC1: Hệ thống phải phát hiện và chặn nếu 2 server trong cùng một môi trường (Environment) có trùng IP.

**US-3.2: Quản lý Phân vùng mạng (Network Zone)**
- **As a** Chuyên gia bảo mật (OPERATOR)
- **I want to** Định nghĩa các vùng mạng (Zone) và quản lý dải IP thuộc vùng đó
- **So that** Tôi có cơ sở để thiết lập các luật tường lửa (Firewall Rules) giữa các vùng.
- **Acceptance Criteria:**
  - AC1: Hỗ trợ tạo Zone (VLAN, Subnet) theo loại `INTERNAL`, `DMZ`, `EXTERNAL`.
  - AC2: Hỗ trợ import/export hàng loạt IP thuộc về một Zone.

**US-3.3: Quản lý Luật Tường lửa (Firewall Rules)**
- **As a** Chuyên gia bảo mật (OPERATOR)
- **I want to** Quản lý các luật tường lửa (ALLOW/DENY) giữa các vùng mạng hoặc IP cụ thể qua các Port
- **So that** Tôi kiểm soát chặt chẽ lưu lượng giao tiếp trong mạng hạ tầng.
- **Acceptance Criteria:**
  - AC1: Tạo luật kết nối từ Source (Zone/IP) đến Target (Zone/IP) trên một Port/Protocol cụ thể.
  - AC2: Trực quan hóa các luật này qua giao diện "Firewall Topology" dưới dạng sơ đồ đồ thị.

---

## Epic 4: Quản lý Catalog Ứng dụng & Triển khai

**US-4.1: Unified Application Catalog**
- **As a** Quản trị viên nghiệp vụ (OPERATOR)
- **I want to** Quản lý cả ứng dụng nghiệp vụ (`BUSINESS`) và phần mềm hạ tầng (`SYSTEM`) chung trong một Catalog
- **So that** Việc triển khai ứng dụng được chuẩn hóa từ một nguồn dữ liệu duy nhất.
- **Acceptance Criteria:**
  - AC1: Application Group phải có phân loại `group_type` rõ ràng (Business/Infra).
  - AC2: Ứng dụng thuộc loại `SYSTEM` sẽ có thêm metadata như `vendor`, `eol_date`.

**US-4.2: Quản lý Bản ghi Triển khai (App Deployments)**
- **As a** Kỹ sư vận hành (OPERATOR)
- **I want to** Ghi nhận ứng dụng X đang chạy phiên bản Y trên server Z
- **So that** Mọi người đều có thể tra cứu nhanh chóng kiến trúc triển khai thực tế.
- **Acceptance Criteria:**
  - AC1: Phải hỗ trợ import hàng loạt (bulk import) các bản ghi deployment kèm nhiều port (`multi-port deployment`).
  - AC2: Phát hiện conflict Port: Không cho phép 2 ứng dụng khác nhau listen trên cùng 1 Port + Protocol trên cùng 1 Server.

---

## Epic 5: Topology 2D & Tương tác Kiến trúc

**US-5.1: Sơ đồ Mạng lưới Tương tác (Interactive Topology)**
- **As a** Kiến trúc sư hệ thống (VIEWER/OPERATOR)
- **I want to** Xem cấu trúc hạ tầng dưới dạng sơ đồ mạng nhện (Graph)
- **So that** Tôi dễ dàng phân tích dependency và luồng dữ liệu.
- **Acceptance Criteria:**
  - AC1: Render sơ đồ sử dụng ReactFlow/ELK cho phép kéo thả, chọn hướng (TB/LR).
  - AC2: Chức năng "Networks Layout" nhóm các AppNode vào bên trong Server Box.
  - AC3: Hỗ trợ bộ lọc chéo (Cascade filter) Group -> Server -> App để thu hẹp vùng hiển thị.
  - AC4: Cạnh (Edge) có thể tuỳ biến dạng Cong (Bezier) hoặc Góc cạnh (Orthogonal), nhãn (Label) có thể kéo thả tránh chồng lấp.

**US-5.2: Kiểm tra Sức khoẻ Kết nối (Connection Health Check)**
- **As a** Kỹ sư vận hành (OPERATOR)
- **I want to** Phân tích nhanh sơ đồ để tìm ra các rủi ro cấu trúc
- **So that** Tôi ngăn ngừa các sự cố sập mạng dây chuyền.
- **Acceptance Criteria:**
  - AC1: Tính năng "Kiểm tra kết nối" sẽ scan toàn bộ graph đang hiện trên màn hình.
  - AC2: Cảnh báo: Circular Dependency (A gọi B, B gọi A), Single Point of Failure (1 node hứng quá >5 kết nối), kết nối chéo môi trường (DEV gọi qua PROD), ứng dụng mồ côi (không ai gọi).

---

## Epic 6: Audit Log & Lịch sử thay đổi

**US-6.1: Ghi nhận Dấu vết Thao tác (Audit Trail)**
- **As a** Quản trị viên bảo mật (ADMIN)
- **I want to** Mọi hành động Create/Update/Delete đều được ghi log lại
- **So that** Tôi có thể điều tra nếu xảy ra phá hoại hoặc lỗi cấu hình hệ thống.
- **Acceptance Criteria:**
  - AC1: `AuditLogInterceptor` tự động bắt mọi request POST/PATCH/DELETE thành công.
  - AC2: Lưu trữ đầy đủ ID đối tượng, giá trị cũ (old value), giá trị mới (new value), IP và User.
  - AC3: Hỗ trợ Streaming Export log ra file CSV cho các hệ thống SIEM bên ngoài phân tích.

**US-6.2: Theo dõi Lịch sử Thay đổi (Change History)**
- **As a** Kỹ sư hệ thống (OPERATOR)
- **I want to** Xem lịch sử cấu hình của một server/app cụ thể theo dòng thời gian (Timeline)
- **So that** Tôi biết cấu hình này đã bị ai sửa đổi gần đây.
- **Acceptance Criteria:**
  - AC1: Có UI hiển thị diff (so sánh JSON cấu hình cũ/mới) trực quan trên giao diện chi tiết.
  - AC2: Hiển thị badge "Đã thay đổi" cho các tài nguyên có thao tác update trong vòng 7 ngày gần nhất.
