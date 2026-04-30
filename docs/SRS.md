# 🎯 1. Mục tiêu hệ thống

Xây dựng hệ thống **Quản lý hạ tầng server & ứng dụng triển khai (Infrastructure & Deployment Management System)** nhằm:

* Quản lý tập trung toàn bộ server theo từng môi trường (DEV / UAT / PROD / DR)
* Theo dõi cấu hình phần cứng, mạng, phần mềm và lịch sử thay đổi
* Quản lý quan hệ giữa server – ứng dụng – network – tài nguyên
* Cho phép tra cứu nhanh: ứng dụng đang chạy trên server nào, các kết nối liên quan
* Trực quan hoá topology kết nối theo môi trường và xuất báo cáo
* Kiểm soát toàn bộ thao tác người dùng qua audit log

---

# 🧭 2. Phạm vi (Scope)

Hệ thống bao gồm các module chính:

0. Xác thực & Quản lý người dùng (Auth & User Management) *(nền tảng bắt buộc)*
1. Quản lý Module hệ thống *(Admin only)*
2. Quản lý Server
3. Quản lý Linh kiện (Hardware Inventory)
4. Quản lý Mạng (Network Configuration)
5. Quản lý Phần mềm & Ứng dụng (bao gồm nhóm ứng dụng và hồ sơ tài liệu triển khai)
6. Topology & Kết nối ứng dụng (2D/3D, realtime, snapshot, draft & preview)
7. Audit Log & Lịch sử thay đổi

> **Nguyên tắc kiến trúc:** Toàn bộ hệ thống được xây dựng theo kiến trúc **module độc lập**, cho phép triển khai và kích hoạt từng module riêng biệt. Xem lộ trình triển khai chi tiết tại mục 10.

---

# 🧱 3. Mô hình dữ liệu tổng thể (High-level Domain Model)

Entity chính:

* **User** — người dùng hệ thống (local hoặc Microsoft 365)
* **Role** — vai trò với tập quyền cố định (`ADMIN` / `OPERATOR` / `VIEWER`)
* **UserGroup** — nhóm chức năng/phòng ban, có role mặc định, quản lý thành viên
* **UserGroupMember** — quan hệ User ↔ UserGroup
* **UserRole** — role gán trực tiếp cho user (override role nhóm)
* **ModuleConfig** — cấu hình bật/tắt từng module trong hệ thống
* **Server** — đơn vị vật lý/ảo hoá chạy dịch vụ
* **Hardware Component** — linh kiện gắn vào server
* **Network Configuration** — interface mạng / IP / domain
* **ApplicationGroup** — nhóm phân loại ứng dụng, phân loại qua `GroupType` (`BUSINESS` | `INFRASTRUCTURE`)
* **Application** — ứng dụng nghiệp vụ hoặc phần mềm hạ tầng (OS, DB, Middleware, Runtime...)
* **AppDeployment** — bản ghi triển khai: Application × Server × Environment (kèm hồ sơ tài liệu)
* **DeploymentHistory** — lịch sử thay đổi phiên bản/trạng thái của Deployment (Change Management) *(môi trường Sprint 16)*
* **DeploymentDocType** — loại tài liệu triển khai, cấu hình tập trung *(thêm mới)*
* **DeploymentDoc** — tài liệu thực tế của 1 AppDeployment (preview + final file) *(thêm mới)*
* **AppConnection** — kết nối giữa 2 application (upstream/downstream)
* **Port Mapping** — port listen của application trên server
* **TopologySnapshot** — bản chụp toàn bộ topology tại 1 thời điểm
* **ChangeSet** — tập hợp thay đổi đang ở trạng thái Draft, chưa apply
* **ChangeItem** — 1 thay đổi đơn lẻ trong ChangeSet
* **AuditLog** — bản ghi mọi thao tác người dùng
* **ChangeHistory** — snapshot cấu hình từng object theo thời gian
* **InfraSystem** — nhóm các server theo hệ thống nghiệp vụ (ví dụ: LOS, BPM, Mobile App...) *(môi trường Sprint 9)*
* **InfraSystemAccess** — phân quyền truy cập hệ thống theo người dùng hoặc nhóm *(môi trường Sprint 9)*

### Quan hệ ERD chính

```
User                *──* UserGroupMember  *──* UserGroup
User                *──* UserRole         *──1 Role
UserGroup           *──1 Role (role mặc định)
ModuleConfig        —— (global config, per module key)
ApplicationGroup    1──* Application
ApplicationGroup    1──* SystemSoftware
Server              1──* Hardware Component
Server              1──* Network Configuration
Server              1──* AppDeployment
Application         1──* AppDeployment
Application         1──* Port Mapping
Application         1──* AppConnection (as source or target)
AppDeployment       *──1 DeploymentHistory
AppDeployment       *──1 Environment
AppDeployment       1──* DeploymentDoc
DeploymentDoc       *──1 DeploymentDocType
DeploymentDocType   —— (global config, no parent)
TopologySnapshot    *──1 Environment
TopologySnapshot    *──1 AuditLog
ChangeSet           1──* ChangeItem
ChangeSet           *──1 User
AuditLog            *──1 User
ChangeHistory       *──1 [Server | Application | Network | Hardware]
InfraSystem         1──* Server (qua InfraSystemServer)
InfraSystem         1──* InfraSystemAccess
InfraSystemAccess   *──1 [User | UserGroup]
```

---

# ⚙️ 4. Yêu cầu chức năng chi tiết

## 4.0. Xác thực & Quản lý người dùng (Auth & User Management)

### 4.0.1. Xác thực (Authentication)

Hệ thống hỗ trợ 2 phương thức đăng nhập, hoạt động song song:

#### Local Account

* Đăng nhập bằng username + password
* Mật khẩu lưu dạng hash (bcrypt)
* Hỗ trợ đổi mật khẩu, reset mật khẩu qua email

#### Microsoft 365 (SSO — OAuth 2.0 / OpenID Connect)

* Đăng nhập bằng tài khoản Microsoft 365 tổ chức (Azure AD / Entra ID)
* Luồng: người dùng click "Đăng nhập bằng Microsoft" → redirect sang Microsoft login → callback → tạo/đồng bộ User trong hệ thống
* Tự động đồng bộ thông tin: tên, email, ảnh đại diện từ Microsoft Graph API
* Nếu email đã tồn tại dưới dạng local account → liên kết tài khoản (account linking)
* Quản trị viên cấu hình: Tenant ID, Client ID, Client Secret, allowed domain(s)
* Có thể **vô hiệu hoá local login** và bắt buộc dùng Microsoft 365 (configurable per environment)

#### Phiên đăng nhập

* JWT access token (short-lived) + refresh token (long-lived, rotate on use)
* Lưu thông tin session: IP, user agent, thời gian đăng nhập
* Đăng xuất thu hồi refresh token ngay lập tức
* Tự động đăng xuất sau thời gian không hoạt động (configurable)

---

### 4.0.2. Quản lý người dùng (User Management)

#### Thuộc tính User

| Trường | Mô tả |
|---|---|
| ID | Định danh |
| Họ tên | Tên hiển thị |
| Email | Unique, dùng làm định danh đăng nhập |
| Avatar | Ảnh đại diện (upload hoặc sync từ Microsoft) |
| Loại tài khoản | `LOCAL` / `MICROSOFT_365` |
| Trạng thái | `ACTIVE` / `INACTIVE` / `LOCKED` |
| Roles | Danh sách role được gán trực tiếp |
| UserGroups | Danh sách nhóm chức năng thuộc về |
| Ngày tạo, người tạo | — |
| Lần đăng nhập cuối | — |

#### Chức năng quản lý User (ADMIN only)

* Danh sách user, filter theo trạng thái / loại tài khoản / role / nhóm
* Tạo local account thủ công (Admin tạo, gửi email kích hoạt)
* Kích hoạt / vô hiệu hoá / khoá tài khoản
* Gán / gỡ role trực tiếp cho user
* Gán / gỡ user vào UserGroup
* Xem lịch sử đăng nhập của user
* Reset mật khẩu (local account)
* Không thể xoá user — chỉ INACTIVE để giữ audit trail

---

### 4.0.3. Quản lý nhóm người dùng (UserGroup Management)

**UserGroup** là nhóm chức năng/phòng ban phản ánh cơ cấu tổ chức. Mỗi nhóm có role mặc định riêng — user khi được thêm vào nhóm sẽ kế thừa role của nhóm đó.

#### Thuộc tính UserGroup

| Trường | Mô tả |
|---|---|
| ID | Định danh |
| Mã nhóm | Unique code (ví dụ: `PTUD`, `VH_APP`) |
| Tên nhóm | Tên hiển thị đầy đủ |
| Mô tả | Trách nhiệm của nhóm |
| Role mặc định | Role được gán tự động cho thành viên (`ADMIN` / `OPERATOR` / `VIEWER`) |
| Trưởng nhóm | User được chỉ định làm trưởng nhóm (optional) |
| Trạng thái | `ACTIVE` / `INACTIVE` |
| Số thành viên | Đếm tự động |

#### Nhóm gợi ý ban đầu

| Mã nhóm | Tên nhóm | Role mặc định | Trách nhiệm điển hình |
|---|---|---|---|
| `PTUD` | Phát triển ứng dụng | `OPERATOR` | Quản lý ứng dụng, deployment, AppConnection |
| `VH_APP` | Vận hành ứng dụng | `OPERATOR` | Theo dõi trạng thái, upload tài liệu triển khai |
| `CSHT` | Cơ sở hạ tầng | `OPERATOR` | Quản lý server, hardware, network, port |
| `PTNV` | Phân tích nghiệp vụ | `VIEWER` | Xem topology, tra cứu, export báo cáo |
| `ADMIN_GRP` | Quản trị hệ thống | `ADMIN` | Toàn quyền hệ thống |

> Danh sách nhóm có thể thêm/sửa/xoá bởi ADMIN — không cố định trong code.

#### Quan hệ User ↔ UserGroup ↔ Role

```
User  ──*  UserGroupMember  *──  UserGroup
UserGroup  ──1  Role (role mặc định)
User  ──*  UserRole (role gán trực tiếp, override)
```

Quy tắc tính quyền thực tế:
* Quyền = **union** của: role gán trực tiếp + role mặc định của tất cả nhóm đang thuộc về
* Nếu bị INACTIVE/LOCKED → mất mọi quyền bất kể role/nhóm

#### Chức năng quản lý UserGroup (ADMIN only)

* CRUD UserGroup (tạo/sửa/xoá nhóm, không xoá được nhóm còn thành viên)
* Danh sách thành viên từng nhóm + trạng thái + role thực tế
* Thêm / gỡ thành viên hàng loạt (chọn nhiều user cùng lúc)
* Thay đổi role mặc định của nhóm → áp dụng ngay cho toàn bộ thành viên không có direct role override
* Xem nhóm thuộc về trên trang profile của từng user
* Filter user theo nhóm ở trang quản lý User

---

### 4.0.4. Phân quyền theo Role (RBAC)

#### Các role hệ thống

| Role | Mô tả |
|---|---|
| `ADMIN` | Toàn quyền: quản lý user, nhóm, module config, mọi dữ liệu |
| `OPERATOR` | Thêm/sửa/xoá dữ liệu nghiệp vụ, không quản lý user/module |
| `VIEWER` | Chỉ xem, không thể tạo/sửa/xoá bất cứ thứ gì |

> Role là **cố định** (không cho phép tạo role tuỳ chỉnh ở phase 1). Có thể mở rộng sau.

#### Ma trận quyền theo module (mẫu)

| Hành động | ADMIN | OPERATOR | VIEWER |
|---|---|---|---|
| Xem dữ liệu | ✅ | ✅ | ✅ |
| Tạo / sửa / xoá dữ liệu | ✅ | ✅ | ❌ |
| Apply ChangeSet | ✅ | ✅ | ❌ |
| Upload tài liệu | ✅ | ✅ | ❌ |
| Quản lý User / UserGroup | ✅ | ❌ | ❌ |
| Bật / tắt Module | ✅ | ❌ | ❌ |
| Cấu hình hệ thống (SSO, DocType...) | ✅ | ❌ | ❌ |
| Xem Audit Log | ✅ | ✅ | ❌ |

---

## 4.0b. Quản lý Module hệ thống (Module Management — ADMIN only)

### Khái niệm

Mỗi **module** trong hệ thống có thể được bật hoặc tắt độc lập qua giao diện quản trị, không cần deploy lại. Khi tắt 1 module, toàn bộ menu, API endpoint và UI liên quan sẽ bị ẩn/vô hiệu hoá với mọi người dùng.

### Thuộc tính ModuleConfig

| Trường | Mô tả |
|---|---|
| Module Key | Định danh duy nhất (ví dụ: `TOPOLOGY_3D`, `DEPLOYMENT_DOCS`) |
| Tên hiển thị | Tên thân thiện |
| Mô tả | Chức năng module |
| Loại | `CORE` / `EXTENDED` |
| Trạng thái | `ENABLED` / `DISABLED` |
| Phụ thuộc | Danh sách module phải ENABLED trước khi module này được bật |
| Cập nhật lần cuối | Thời điểm + người thay đổi |

### Danh sách module có thể quản lý

| Module Key | Tên | Loại | Phụ thuộc |
|---|---|---|---|
| `SERVER_MGMT` | Quản lý Server | CORE | — |
| `HARDWARE_MGMT` | Quản lý Linh kiện | CORE | SERVER_MGMT |
| `NETWORK_MGMT` | Quản lý Mạng | CORE | SERVER_MGMT |
| `APP_GROUP` | Nhóm ứng dụng | CORE | — |
| `SOFTWARE_MGMT` | Quản lý Phần mềm & Ứng dụng | CORE | APP_GROUP |
| `PORT_MGMT` | Quản lý Port | CORE | SOFTWARE_MGMT, SERVER_MGMT |
| `AUDIT_LOG` | Audit Log | CORE | — |
| `TOPOLOGY_2D` | Topology 2D | EXTENDED | SERVER_MGMT, SOFTWARE_MGMT |
| `TOPOLOGY_3D` | Topology 3D | EXTENDED | TOPOLOGY_2D |
| `REALTIME_STATUS` | Trạng thái realtime (GraphQL) | EXTENDED | TOPOLOGY_2D |
| `TOPOLOGY_SNAPSHOT` | Topology Snapshot | EXTENDED | TOPOLOGY_2D, AUDIT_LOG |
| `CHANGESET` | ChangeSet Draft & Preview | EXTENDED | TOPOLOGY_2D, AUDIT_LOG |
| `DEPLOYMENT_DOCS` | Hồ sơ tài liệu triển khai | EXTENDED | SOFTWARE_MGMT |
| `CHANGE_HISTORY` | Lịch sử thay đổi & Diff view | EXTENDED | AUDIT_LOG |
| `IMPORT_CSV` | Import CSV / Excel | EXTENDED | — |
| `SSH_SYNC` | Sync SSH / Auto-discovery | EXTENDED | SERVER_MGMT |
| `ALERT` | Alert & Notification | EXTENDED | AUDIT_LOG |

### Chức năng

* **Danh sách module**: bảng hiển thị tất cả module, trạng thái, loại, dependency
* **Bật / Tắt module**: toggle trực tiếp trên bảng
  * Khi **bật**: kiểm tra tất cả dependency đã ENABLED chưa — nếu chưa, hiện cảnh báo và gợi ý bật dependency trước
  * Khi **tắt**: kiểm tra có module khác đang phụ thuộc vào module này không — nếu có, yêu cầu tắt module phụ thuộc trước hoặc tắt đồng thời (cascade confirm)
* Thay đổi trạng thái có hiệu lực **ngay lập tức** — không cần restart
* Mọi thay đổi bật/tắt đều ghi **Audit Log** (ai bật/tắt, thời điểm)
* Module `CORE` **không thể tắt** qua UI (nút toggle bị disabled, hiển thị tooltip giải thích)

### UI Module Management

* Trang `/admin/modules` — chỉ ADMIN mới truy cập được
* Phân nhóm hiển thị: Core / Extended
* Badge dependency: click vào module xem module nào phụ thuộc vào nó
* Timeline thay đổi: log lịch sử bật/tắt từng module

---

## 4.1. Quản lý Server

### Thông tin cơ bản

* Mã server (unique)
* Tên server, Hostname
* Mục đích: `APP_SERVER` | `DB_SERVER` | `PROXY` | `LOAD_BALANCER` | `CACHE` | `MESSAGE_QUEUE` | `OTHER`
* Trạng thái: `ACTIVE` | `INACTIVE` | `MAINTENANCE`
* Môi trường: `DEV` | `UAT` | `PROD` *(bổ sung PROD)*
* Loại hạ tầng: `VIRTUAL_MACHINE` | `PHYSICAL_SERVER` | `CONTAINER` | `CLOUD_INSTANCE`
* Site: `DC` | `DR`
* Hệ điều hành (OS)
* Mô tả

### Liên kết dữ liệu

* Danh sách Hardware Components
* Danh sách Network Configurations
* Danh sách AppDeployments (ứng dụng + version đang chạy)

### Chức năng

* CRUD server
* Tìm kiếm / filter (loại, hostname, trạng thái, môi trường, site)
* Dashboard chi tiết server (tab: Hardware / Network / Applications / History)
* **Xem lịch sử thay đổi cấu hình server** (ai thay đổi, thay đổi gì, thời điểm nào)
* **Badge "Đã thay đổi"** nếu cấu hình có thay đổi trong N ngày gần nhất

---

## 4.2. Quản lý Linh kiện (Hardware Inventory)

### Thuộc tính

* Mã linh kiện, Loại: `CPU` | `RAM` | `HDD` | `SSD` | `NETWORK_CARD`
* Thông số: CPU (core/thread/clock), RAM (dung lượng), Disk (dung lượng/loại)
* Serial, Model, Nhà sản xuất

### Chức năng

* CRUD linh kiện
* Gán / gỡ linh kiện khỏi server
* **Lịch sử gán/gỡ linh kiện** (thời điểm, người thực hiện, server)

---

## 4.3. Quản lý Mạng (Network Configuration)

### Thuộc tính

* Private IP, Public IP, NAT IP
* Domain, Subnet, Gateway, DNS
* Proxy config
* Gắn với Server + Interface name

### Chức năng

* CRUD cấu hình mạng
* Validate IP / domain (phát hiện trùng IP trong cùng môi trường)
* **Mapping domain → server → application** (tra cứu ngược từ domain biết ứng dụng nào đang dùng)
* Alert khi IP / domain bị trùng

---

## 4.4. Quản lý Phần mềm & Ứng dụng

### 4.4.1. Application Catalog (Unified)

Từ Sprint 16, toàn bộ phần mềm (nghiệp vụ và hệ thống) được quản lý tập trung trong một Catalog duy nhất:

*   **Application Type**:
    *   `BUSINESS`: Ứng dụng nghiệp vụ (ERP, CRM, Mobile App...).
    *   `SYSTEM`: Phần mềm hạ tầng (OS, Database, Web Server, Runtime...).
*   **Metadata mở rộng**:
    *   `vendor`: Nhà cung cấp (Oracle, Microsoft, Open Source...).
    *   `eol_date`: Ngày hết hạn hỗ trợ (End of Life).
*   **Application Group**: Mỗi ứng dụng thuộc về một nhóm có `GroupType` tương ứng (`BUSINESS` hoặc `INFRASTRUCTURE`).

### 4.4.2. Ứng dụng nghiệp vụ (Business Applications)

#### Thuộc tính

* Mã ứng dụng, Tên, Version, Mô tả, Owner/team
* Môi trường hiện tại đang chạy
* **Nhóm ứng dụng** — phân loại nghiệp vụ (ví dụ: Core Banking, Payment, CRM, Internal Tool, Infrastructure...)

#### AppDeployment (bản ghi triển khai)

Mỗi lần deploy là 1 record riêng. Ngoài thông tin kỹ thuật, deployment còn mang theo đầy đủ thông tin quản lý và hồ sơ tài liệu:

**Thông tin cơ bản:**

| Trường | Mô tả |
|---|---|
| Application | Ứng dụng được triển khai |
| Server | Server đích |
| Môi trường | DEV / UAT / PROD |
| Version | Version được deploy |
| Trạng thái | `RUNNING` / `STOPPED` / `DEPRECATED` |
| Ngày deploy thực tế | Ngày hoàn thành triển khai |

**Thông tin quản lý:**

| Trường | Mô tả |
|---|---|
| Tiêu đề triển khai | Tên mô tả đợt triển khai (ví dụ: "Nâng cấp module thanh toán v2.3") |
| Ngày deploy dự kiến | Ngày kế hoạch triển khai |
| Tên CMC | Tên phiên Change Management Committee phê duyệt |
| Người trình triển khai | Người trình bày và chịu trách nhiệm deploy |

**Hồ sơ tài liệu triển khai:**

Danh sách loại tài liệu được cấu hình tập trung toàn hệ thống (xem mục 4.4.4). Mỗi loại tài liệu có thể bật/tắt bắt buộc (`required`) tuỳ theo môi trường hoặc loại deployment. Với mỗi loại tài liệu, deployment lưu tối đa **2 file**:

| File | Định dạng cho phép | Mô tả |
|---|---|---|
| **Preview** | `.docx` / `.xlsx` / `.pdf` | Bản nháp / bản trình duyệt |
| **Final** | `.pdf` (chỉ PDF đã ký) | Bản chính thức có chữ ký |

Trạng thái tài liệu của 1 deployment:
* `PENDING` — chưa có file nào
* `DRAFT` — có file preview, chưa có final
* `COMPLETE` — đã có file final (PDF đã ký)
* `WAIVED` — được miễn nộp tài liệu này (ghi lý do)

#### AppDeployment — Chức năng

* Tạo / cập nhật / xem deployment record
* Upload / thay thế file preview và final cho từng loại tài liệu
* Preview file ngay trong UI (PDF viewer, không cần download)
* Theo dõi tiến độ tài liệu: bao nhiêu loại đã COMPLETE / còn PENDING
* Cảnh báo nếu deployment ở môi trường PROD có tài liệu required chưa COMPLETE
* Lịch sử upload: ai upload file nào, lúc nào (audit)

#### Chức năng tra cứu nhanh

* **"Ứng dụng X đang chạy ở server nào?"** — hiện danh sách server theo môi trường, trạng thái, version
* **"Server Y đang chạy những ứng dụng nào?"** — hiện full list với trạng thái và version
* Lọc theo môi trường, trạng thái deployment, nhóm ứng dụng

---

### 4.4.4. Cấu hình loại tài liệu triển khai (DeploymentDocType)

Quản trị viên cấu hình tập trung danh sách các loại tài liệu áp dụng cho toàn hệ thống:

| Trường | Mô tả |
|---|---|
| Mã loại | Unique code (ví dụ: `DEPLOY_PLAN`, `TEST_REPORT`, `ROLLBACK_PLAN`) |
| Tên loại | Tên hiển thị |
| Mô tả | Hướng dẫn nội dung tài liệu |
| Thứ tự | Vị trí hiển thị trong danh sách |
| Required mặc định | Bật/tắt bắt buộc theo mặc định |
| Áp dụng cho môi trường | Có thể giới hạn chỉ áp dụng với PROD, hoặc tất cả |
| Trạng thái | `ACTIVE` / `INACTIVE` |

Khi tạo 1 AppDeployment mới, hệ thống tự động sinh danh sách tài liệu từ các `DeploymentDocType` đang ACTIVE, với cờ `required` theo cấu hình mặc định (người dùng có thể override từng record).

### 4.4.3. Quản lý Port

* Port number, Protocol (`TCP` | `UDP`), Service name
* Gắn với Application × Server
* **Phát hiện port conflict** trên cùng 1 server

---

## 4.5. Topology & Kết nối ứng dụng

### AppConnection — kết nối giữa các ứng dụng

Mỗi kết nối là 1 record:

| Trường | Mô tả |
|---|---|
| Source App | Ứng dụng gọi đến |
| Target App | Ứng dụng được gọi |
| Protocol | `HTTP` / `HTTPS` / `gRPC` / `TCP` / `MQ` / `DB` |
| Port | Port kết nối |
| Môi trường | DEV / UAT / PROD |
| Mô tả | Mục đích kết nối |

### Chức năng xem kết nối hiện tại

* CRUD AppConnection
* **Xem toàn bộ dependency của 1 ứng dụng** — upstream (ai gọi nó) và downstream (nó gọi đến đâu)
* **Xem kết nối qua server** — application A (server X) → application B (server Y)
* **Topology diagram** — sơ đồ kết nối dạng graph, filter theo môi trường
* Filter topology theo: môi trường, site (DC/DR), ứng dụng cụ thể, server cụ thể

### Topology Visualization — 2D & 3D

Người dùng có thể chuyển đổi giữa 2 chế độ hiển thị:

#### Chế độ 2D

* Graph layout tự động (force-directed): node là server/app, edge là kết nối
* Node hiển thị: tên, loại (icon), trạng thái (màu sắc)
* Edge hiển thị: protocol, port, trạng thái kết nối realtime
* Zoom / pan, click node để xem chi tiết (side panel)
* Mini-map điều hướng khi graph lớn
* Các layout tuỳ chọn: force-directed, hierarchical, circular

#### Chế độ 3D

* Render graph 3 chiều — xoay, zoom, pan bằng chuột/trackpad
* Node được nhóm theo tầng: Physical → Server → Application
* Cho phép "nổ tung" (explode view) theo môi trường hoặc site (DC/DR)
* Hiệu ứng hover: highlight toàn bộ kết nối liên quan đến node đó
* Chế độ VR-ready (optional, future-proof)

#### Trạng thái kết nối realtime

Mỗi edge (AppConnection) hiển thị trạng thái live:

| Trạng thái | Màu | Ý nghĩa |
|---|---|---|
| `HEALTHY` | Xanh lá | Kết nối hoạt động bình thường |
| `DEGRADED` | Vàng | Có lỗi / độ trễ cao |
| `DOWN` | Đỏ | Mất kết nối |
| `UNKNOWN` | Xám | Chưa có dữ liệu / không theo dõi |

Trạng thái node server:

| Trạng thái | Màu | Ý nghĩa |
|---|---|---|
| `ACTIVE` | Xanh lá | Đang hoạt động |
| `MAINTENANCE` | Vàng | Đang bảo trì |
| `INACTIVE` | Đỏ | Ngừng hoạt động |

### Realtime với GraphQL Subscription

Hệ thống cung cấp GraphQL API làm lớp dữ liệu chính cho topology:

#### Query (tra cứu linh hoạt)

```graphql
# Toàn bộ topology theo môi trường
query Topology($env: Environment!) {
  topology(environment: $env) {
    servers { id name status role site }
    connections { sourceApp targetApp protocol port status }
    deployments { app { id name } server { id hostname } status }
  }
}

# Dependency của 1 ứng dụng
query AppDependency($appId: ID!) {
  application(id: $appId) {
    upstreams { app protocol port status }
    downstreams { app protocol port status }
    deployments { server environment status }
  }
}
```

#### Subscription (cập nhật realtime)

```graphql
# Lắng nghe thay đổi trạng thái kết nối
subscription ConnectionStatus($env: Environment!) {
  connectionStatusChanged(environment: $env) {
    connectionId sourceApp targetApp
    status previousStatus changedAt
  }
}

# Lắng nghe thay đổi trạng thái server
subscription ServerStatus {
  serverStatusChanged {
    serverId hostname status previousStatus changedAt
  }
}

# Lắng nghe khi có ChangeSet được apply
subscription TopologyChanged($env: Environment!) {
  topologyChanged(environment: $env) {
    changeSetId appliedBy appliedAt snapshotId
  }
}
```

#### Nguồn dữ liệu realtime

* Trạng thái kết nối / server được cập nhật qua:
  * **Push từ agent / monitoring** (Prometheus Alertmanager webhook, custom health-check agent)
  * **Manual update** qua UI hoặc API
* GraphQL subscription dùng WebSocket (protocol: `graphql-ws`)
* Fallback polling nếu WebSocket không khả dụng

### Export topology

* PNG / SVG — ảnh sơ đồ dùng trong tài liệu / báo cáo (cả 2D và 3D screenshot)
* JSON / YAML — machine-readable cho IaC / documentation
* Mermaid / PlantUML — embed vào wiki / Confluence / Git

---

## 4.5.1. Topology Snapshot — xem lại mô hình cũ

### Khái niệm

**TopologySnapshot** là bản chụp toàn bộ trạng thái kết nối (server + deployment + connection) tại 1 thời điểm. Cho phép người dùng xem lại và đối chiếu mô hình hạ tầng ở quá khứ.

### Khi nào snapshot được tạo

* Tự động sau mỗi lần **Apply ChangeSet** (xem 4.5.2)
* Tự động theo lịch (configurable, ví dụ: hàng ngày 00:00)
* Thủ công: người dùng bấm "Tạo snapshot hiện tại"

### Thuộc tính TopologySnapshot

| Trường | Mô tả |
|---|---|
| ID | Định danh snapshot |
| Label | Tên mô tả (tự đặt hoặc auto-generate) |
| Môi trường | DEV / UAT / PROD |
| Timestamp | Thời điểm tạo |
| Triggered by | `MANUAL` / `AUTO_SCHEDULE` / `CHANGESET_APPLY` |
| Created by | User (nếu manual) |
| Payload | JSON toàn bộ topology tại thời điểm đó |

### Chức năng

* **Xem topology tại thời điểm bất kỳ** — chọn snapshot từ timeline, render graph như hiện tại
* **So sánh 2 snapshot** (diff view trên graph):
  * Node/edge thêm vào: highlight màu xanh
  * Node/edge bị xoá: highlight màu đỏ
  * Node/edge thay đổi thông tin: highlight màu vàng
* **So sánh snapshot cũ với hiện tại** (shortcut: "So sánh với hiện tại")
* Export snapshot cũ (cùng định dạng như topology hiện tại)
* Tìm kiếm snapshot theo: môi trường, khoảng thời gian, label

---

## 4.5.2. Draft & Preview — kiểm tra trước khi cập nhật hiện trạng

### Khái niệm

Thay vì áp dụng thay đổi ngay lập tức, người dùng có thể tích luỹ các thay đổi vào một **ChangeSet** ở trạng thái `DRAFT`. Khi sẵn sàng, preview toàn bộ tác động rồi mới **Apply** để cập nhật hiện trạng chính thức.

### Trạng thái ChangeSet

```
DRAFT → PREVIEWING → APPLIED
                   → DISCARDED
```

| Trạng thái | Mô tả |
|---|---|
| `DRAFT` | Đang tích luỹ thay đổi, chưa ảnh hưởng dữ liệu chính thức |
| `PREVIEWING` | Người dùng đang xem preview, chưa apply |
| `APPLIED` | Đã apply, dữ liệu chính thức được cập nhật, snapshot được tạo |
| `DISCARDED` | Bị huỷ, không có thay đổi nào được lưu |

### Thuộc tính ChangeSet

| Trường | Mô tả |
|---|---|
| ID | Định danh |
| Tên / mô tả | Ví dụ: "Triển khai đợt tháng 4 – PROD" |
| Môi trường | DEV / UAT / PROD |
| Trạng thái | DRAFT / PREVIEWING / APPLIED / DISCARDED |
| Created by | Người tạo |
| Applied by | Người apply (có thể khác người tạo) |
| ChangeItems | Danh sách thay đổi đơn lẻ trong draft |

### ChangeItem — từng thay đổi trong draft

| Trường | Mô tả |
|---|---|
| Resource Type | `SERVER` / `APP_DEPLOYMENT` / `APP_CONNECTION` / `NETWORK` / ... |
| Resource ID | ID đối tượng |
| Operation | `CREATE` / `UPDATE` / `DELETE` |
| Old Value | Trạng thái hiện tại (JSON) |
| New Value | Trạng thái đề xuất (JSON) |

### Luồng sử dụng (workflow)

1. Người dùng tạo ChangeSet mới (đặt tên, chọn môi trường)
2. Thực hiện các thay đổi trong chế độ Draft — mỗi thay đổi được lưu vào ChangeSet, **không** ảnh hưởng dữ liệu live
3. Bấm **"Preview"** — hệ thống render topology với tất cả thay đổi của ChangeSet được áp dụng lên trên trạng thái hiện tại:
   * Hiển thị diff trực quan trên graph (thêm / sửa / xoá)
   * Liệt kê danh sách thay đổi dạng bảng
   * Cảnh báo nếu phát hiện: port conflict, IP trùng, vòng lặp kết nối
4. Người dùng có thể **chỉnh sửa tiếp** trong Draft hoặc **Apply**
5. Bấm **"Apply"** — xác nhận (confirm dialog):
   * Dữ liệu live được cập nhật theo từng ChangeItem
   * Snapshot topology được tạo tự động
   * Audit log ghi nhận toàn bộ ChangeSet và người apply
6. Hoặc bấm **"Discard"** — huỷ toàn bộ draft, không có thay đổi nào được lưu

### Chức năng quản lý ChangeSet

* Danh sách tất cả ChangeSet (filter theo trạng thái, môi trường, người tạo)
* Xem chi tiết ChangeItem trong 1 ChangeSet
* Nhiều người cùng xem/review 1 ChangeSet trước khi Apply
* ChangeSet `APPLIED` và `DISCARDED` được giữ lại làm lịch sử (không xoá)

### 4.5.3 Khả năng tương tác Topology 2D & Networks Layout
**Mô tả:** Bổ sung trình bày Topology 2D theo kiểu Networks (phân nhóm Server Box). Cho phép tạo, xóa connection bằng cách tương tác trực tiếp (kéo-thả/click) trên sơ đồ. Khi tạo kết nối, nếu target app có 1 port thì tự động tạo kết nối; nếu >1 port, hỏi port nào.
**Actor:** ADMIN | OPERATOR
**Acceptance Criteria:**
- AC1: AppNodes được render bên trong Server Box theo parent-child.
- AC2: Có thể kéo cạnh từ Node này sang Node kia trên graph để tạo connection.
- AC3: Hiển thị popup chọn port khi kéo thả thành công, hoặc auto-assign nếu đích trả về 1 port duy nhất.
- AC4: Có thể xoá cạnh trực tiếp khỏi giao diện graph.
**Added:** 2026-04-21

### 4.5.4 Topology 2D — UX Improvements
**Mô tả:** Tối ưu trải nghiệm người dùng trên màn hình Topology 2D bao gồm: sắp xếp tự động khớp viewport, kết nối có thể kéo nhãn để tránh chồng lấp, drag/drop node với vị trí được ghi nhớ sau khi reload, và nút xem toàn màn hình.
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Nút "Tự động sắp xếp" sắp xếp toàn bộ node theo layout dagre rồi tự động zoom fitView để tất cả node nằm gọn trong viewport.
- AC2: Nhãn kết nối (protocol label) có thể kéo (drag) tự do để di chuyển khỏi vị trí chồng lấp với các nhãn khác; vị trí nhãn được lưu trong state cho đến khi dữ liệu reload.
- AC3: Người dùng có thể kéo (drag/drop) từng node lên bất kỳ vị trí nào trên canvas; vị trí đã kéo được giữ nguyên khi dữ liệu tự động làm mới (realtime refetch), chỉ reset khi bấm "Tự động sắp xếp".
- AC4: Nút toàn màn hình (fullscreen) hiển thị trong toolbar khi đang ở chế độ 2D; bấm vào sẽ mở rộng canvas chiếm toàn bộ màn hình, bấm lại hoặc nhấn Esc để thoát.
**Added:** 2026-04-22

### 4.5.5 Topology 2D — Orthogonal Edge Style & Auto-Routing
**Mô tả:** Bổ sung chế độ hiển thị kết nối thẳng góc (orthogonal / step path) cho Topology 2D. Người dùng có thể chọn giữa "Cong" (Bezier) và "Thẳng góc" (Smooth-step) cho tất cả cạnh trên graph. Các cạnh song song (parallel edges) tự động spread theo offset để tránh chồng lên nhau.
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Filter panel có Select "Edges" với 2 lựa chọn: "Cong" (Bezier, mặc định) và "Thẳng góc" (Orthogonal).
- AC2: Khi chọn "Thẳng góc", tất cả cạnh render dưới dạng smooth-step path với góc vuông và bo tròn nhẹ (borderRadius=8).
- AC3: Các cạnh song song (cùng cặp node) được spread bằng offset để không chồng lấp trong cả 2 chế độ.
- AC4: Protocol label vẫn hiển thị đúng màu, drag được, và nằm đúng vị trí midpoint của cạnh trong cả 2 chế độ.
- AC5: Không có TypeScript error mới sau khi thêm tính năng.
**Added:** 2026-04-29

### 4.5.6 Topology — Node Visibility Filter (Ẩn/hiện hệ thống, server, ứng dụng)
**Mô tả:** Cho phép người dùng lọc và ẩn/hiện các hệ thống (nhóm ứng dụng), server cụ thể và ứng dụng cụ thể trực tiếp trên màn hình Topology mà không cần rời trang. Bộ lọc áp dụng cho cả ReactFlow, vis-network và Mermaid.
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Filter panel có 3 multi-select dropdown: "Hệ thống" (nhóm ứng dụng), "Servers", "Ứng dụng".
- AC2: Khi không chọn gì (empty), mặc định hiển thị tất cả (no filter).
- AC3: Khi chọn một hoặc nhiều giá trị, chỉ hiển thị các node/edge liên quan đến lựa chọn đó.
- AC4: Kết nối (edges) tự động ẩn nếu một trong hai đầu không còn hiển thị.
- AC5: Các server không còn app nào hiển thị sẽ bị ẩn khỏi sơ đồ.
- AC6: Options trong dropdown được lấy động từ dữ liệu topology hiện tại (không hardcode).
**Added:** 2026-04-29

### 4.5.7 Topology 2D — Smart Auto-Layout & Collision Avoidance
**Mô tả:** Nâng cấp hệ thống layout cho Topology 2D React Flow. Cho phép chọn thuật toán sắp xếp (Dagre / ELK), chọn hướng layout (Top→Bottom / Left→Right) độc lập, và cải thiện collision avoidance khi kéo thả node.
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Filter bar có Segmented "Thuật toán: Dagre | ELK" (React Flow only).
- AC2: Filter bar có Segmented "Hướng: ↓ TB | → LR" (React Flow only).
- AC3: Bấm "Sắp xếp" áp dụng thuật toán và hướng đã chọn, fit view sau khi xong.
- AC4: ELK layout tránh node chồng lên nhau tốt hơn dagre với graph phức tạp.
- AC5: Khi kéo node vào vùng node khác, node tự động đẩy ra vị trí gần nhất theo 8 hướng.
- AC6: Dagre vẫn là default (synchronous) khi load lần đầu và khi đổi filter.
**Added:** 2026-04-30

### 4.5.8 Topology 2D — Auto-Arrange on Algorithm/Direction Change
**Mô tả:** Khi người dùng thay đổi dropdown "Thuật toán" hoặc "Hướng" trong React Flow, hệ thống tự động chạy lại layout mà không cần bấm nút "Sắp xếp".
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Thay đổi thuật toán (Dagre/ELK/*) → tự động sắp xếp lại ngay lập tức.
- AC2: Thay đổi hướng (TB/BT/LR/RL) → tự động sắp xếp lại ngay lập tức.
- AC3: Auto-arrange chỉ kích hoạt khi đang dùng React Flow engine, không ảnh hưởng vis-network.
- AC4: Sau khi tự sắp xếp, fit view để hiển thị toàn bộ graph.
**Added:** 2026-04-30

### 4.5.9 Topology 2D — Cascade Node Filter (Group → Server → App)
**Mô tả:** Bộ lọc node hoạt động theo cascade: chọn hệ thống (AppGroup) → chỉ hiện servers chứa app thuộc hệ thống đó; chọn server → chỉ hiện apps deploy trên server đó.
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Trong modal "Lọc node", khi chọn một hoặc nhiều Hệ thống, danh sách Servers chỉ hiện những server có app thuộc hệ thống đó.
- AC2: Khi chọn một hoặc nhiều Server, danh sách Ứng dụng chỉ hiện app deploy trên servers đó.
- AC3: Khi xóa filter Hệ thống → Server/App options trở về đầy đủ (reset cascade).
- AC4: Kết hợp được: chọn group + server → app options là intersection.
**Added:** 2026-04-30

### 4.5.10 Topology 2D — Connection Health Check
**Mô tả:** Panel phân tích chất lượng kết nối, phát hiện các vấn đề trong topology: circular dependency, single point of failure, orphaned apps, cross-environment connections, dead connections (đến app không hoạt động).
**Actor:** ADMIN | OPERATOR | VIEWER
**Acceptance Criteria:**
- AC1: Nút "Kiểm tra kết nối" trong PageHeader, hiển thị badge số lượng issue.
- AC2: Click mở Drawer hiển thị danh sách issue phân loại theo severity (ERROR/WARNING/INFO).
- AC3: Phát hiện: circular dependency (A→B→…→A), SPoF (node kết nối > 5 chiều), orphaned app, cross-env connection, dead link (app INACTIVE/STOPPED).
- AC4: Click vào issue → highlight node liên quan trên graph.
- AC5: Tính toán pure FE từ dữ liệu topology hiện tại, không cần API mới.
**Added:** 2026-04-30

---

## 4.6. Audit Log & Lịch sử thay đổi *(first-class module)*

### Nguyên tắc

> **Mọi thao tác tạo / sửa / xóa của người dùng đều phải được ghi audit log** — không có ngoại lệ.

### Thông tin audit log

| Trường | Mô tả |
|---|---|
| Timestamp | Thời điểm chính xác (UTC) |
| User | Người thực hiện (ID + tên + role) |
| Action | `CREATE` / `UPDATE` / `DELETE` / `VIEW_SENSITIVE` |
| Resource Type | `SERVER` / `APPLICATION` / `NETWORK` / `HARDWARE` / ... |
| Resource ID | ID đối tượng bị tác động |
| Old Value | Snapshot trước khi thay đổi (JSON) |
| New Value | Snapshot sau khi thay đổi (JSON) |
| IP Address | IP client |
| User Agent | Trình duyệt / API client |
| Result | `SUCCESS` / `FAILED` / `FORBIDDEN` |

### Change History (server / app / network)

* Mỗi lần cấu hình thay đổi → tạo snapshot diff
* Cho phép **so sánh 2 thời điểm** (diff view)
* Hiển thị timeline thay đổi trên trang chi tiết từng đối tượng
* **Badge / indicator** trên danh sách: hiển thị đối tượng nào có thay đổi gần đây

### Chức năng tìm kiếm & báo cáo audit

* Filter theo: user, resource type, action, thời gian, result
* Export audit log: CSV / Excel
* Giữ audit log tối thiểu 1 năm (configurable)

---

## 4.7. Quản lý hệ thống hạ tầng (Infra System Management)

### 4.7.1. Khái niệm
**InfraSystem** là cấp độ quản lý cao hơn Server, cho phép gom nhóm các Server và Application theo hệ thống nghiệp vụ cụ thể. Một Server có thể thuộc về nhiều InfraSystem khác nhau.

### 4.7.2. Phân quyền truy cập (Access Control)
Hệ thống hỗ trợ phân quyền truy cập theo từng InfraSystem:
* **ADMIN**: Xem và quản lý tất cả InfraSystem.
* **OPERATOR / VIEWER**: Chỉ xem được các Server, Application và Topology liên quan đến InfraSystem mà họ được gán quyền (qua `InfraSystemAccess`).
* Quyền truy cập có thể gán cho từng **User** hoặc **UserGroup**.

### 4.7.3. CSV Import Server chi tiết
**Mô tả:** Hệ thống tập trung vào việc import dữ liệu Server chi tiết từ file CSV, hỗ trợ bóc tách thông số kỹ thuật và hệ điều hành.
**Actor:** ADMIN | OPERATOR
**Acceptance Criteria:**
- AC1: Cung cấp file mẫu với các cột: System, System_Name, IP, Name, Description, Environment, Site, OS, CPU, RAM, Total Storage (GB).
- AC2: Cho phép chọn đè các thuộc tính `Environment`, `Site` cho toàn bộ file import.
- AC3: Tự động parse OS vào trường chuyên biệt và tách CPU/RAM/Storage thành các Hardware Component tương ứng.
- AC4: Parse dữ liệu tại Client để người dùng rà soát và chỉnh sửa trực tiếp trước khi import.
- AC5: Hiển thị báo cáo chi tiết về số lượng Server được tạo mới hoặc cập nhật.
**Added:** 2026-04-24
 
 ### 4.8.2. Quản lý Vòng đời Hệ điều hành (OS Lifecycle)
 **Mô tả:** Thay thế trường OS văn bản thô bằng hệ thống danh mục OS (Catalog) và lịch sử cài đặt chi tiết (Version, Patch, Ngày cài, Người cài, Lý do thay đổi).
 **Actor:** ADMIN | OPERATOR
 **Acceptance Criteria:**
 - AC1: OS được quản lý như một loại ứng dụng hệ thống (`Application` type=SYSTEM, sw_type=OS).
 - AC2: Lưu trữ lịch sử cài đặt không thay đổi (Immutable History): Mỗi lần cài đặt hoặc nâng cấp OS tạo ra một bản ghi `ServerOsInstall`.
 - AC3: Theo dõi Metadata: Mỗi bản ghi cài đặt bao gồm phiên bản (version/patch), ngày cài đặt thực tế, người cài đặt, và lý do thay đổi (bắt buộc khi nâng cấp).
 - AC4: Hiển thị dòng thời gian (Timeline) các phiên bản OS đã sử dụng trên từng server.
 - AC5: Tích hợp bước **OS Resolution** vào quy trình Import: Ánh xạ giá trị OS từ file CSV vào danh mục OS sẵn có hoặc tạo mới trong catalog.
 **Added:** 2026-04-24
  
  ### 4.8.3. Tái cấu trúc Nhóm & Quản lý Deployments tập trung
  **Mô tả:** Phân loại rõ ràng nhóm nghiệp vụ và hạ tầng thông qua `GroupType`. Quy hoạch module Deployments để quản lý tập trung và theo dõi thay đổi (Change Management).
  **Actor:** ADMIN | OPERATOR
  **Acceptance Criteria:**
  - AC1: `ApplicationGroup` bắt buộc chọn `GroupType` (`BUSINESS` hoặc `INFRASTRUCTURE`).
  - AC2: Khi tạo `Application`, hệ thống lọc danh sách nhóm theo `application_type` để đảm bảo tính nhất quán dữ liệu.
  - AC3: Module Deployments chia làm 2 tab chuyên biệt: **Nghiệp vụ** và **Hạ tầng**.
  - AC4: Mọi thay đổi về `version` hoặc `status` trên `AppDeployment` đều được tự động ghi lại vào `DeploymentHistory`.
  - AC5: Cho phép tra cứu lịch sử thay đổi (Change Log) của một deployment cụ thể để phục vụ quản lý sự thay đổi.
  **Added:** 2026-04-24

### 4.8.4. Multi-Port per Deployment — Import nhiều port/protocol cho một deployment
**Mô tả:** Một ứng dụng triển khai trên server có thể lắng nghe nhiều cổng (port) đồng thời (ví dụ: REST trên HTTP/8080 và gRPC trên 9092). Import CSV hỗ trợ khai báo nhiều cặp port-protocol trong một dòng bằng cú pháp `PORT-PROTOCOL:service_name` cách nhau bởi dấu cách.
**Actor:** ADMIN | OPERATOR
**Acceptance Criteria:**
- AC1: Cột `ports` trong CSV nhận giá trị dạng `8080-HTTP:rest-api 9092-gRPC:grpc-api` — mỗi token là một cặp port-protocol, tùy chọn tên dịch vụ sau dấu `:`.
- AC2: Mỗi token tạo ra một Port record độc lập liên kết với cùng deployment.
- AC3: Port conflict detection áp dụng cho từng port trong danh sách — conflict bất kỳ → rollback toàn bộ deployment.
- AC4: Backward compatible: CSV vẫn dùng cột `port`/`protocol`/`service_name` riêng lẻ (Sprint 17 format) vẫn được xử lý đúng như một port duy nhất.
**Added:** 2026-04-25

### 4.8.5. Import Kết nối App-to-App (Connection)
**Mô tả:** Bổ sung trang `/connection-upload` cho phép import hàng loạt kết nối giữa các ứng dụng (AppConnection) từ CSV. Đây là cách nhanh nhất để xây dựng dữ liệu topology kết nối cho hệ thống đã có sẵn.
**Actor:** ADMIN | OPERATOR
**Acceptance Criteria:**
- AC1: CSV có các cột: `source_app`, `target_app`, `environment`, `connection_type`, `target_port` (tùy chọn), `description` (tùy chọn).
- AC2: Upsert theo `(source_app_id, target_app_id, environment, connection_type)` — re-import không tạo duplicate.
- AC3: Nếu `target_port` được cung cấp, hệ thống tra cứu Port record của `target_app` trong `environment` tương ứng và liên kết `target_port_id` để topology render đúng endpoint.
- AC4: Nếu Port không tìm thấy — connection vẫn được tạo với `target_port_id = null`, không fail row.
- AC5: UI 4 bước giống deployment-upload: upload → column map → preview → result.
- AC6: `connection_type` hỗ trợ alias: `grpc` → `GRPC`, `mq` → `AMQP`, `db` → `DATABASE`.
**Added:** 2026-04-25

---

# 🔗 5. Yêu cầu phi chức năng

## Hiệu năng

* API response < 500ms cho các query thông thường
* Topology rendering < 2s cho đồ thị ≤ 200 node

## Bảo mật

* RBAC: phân quyền theo role (`ADMIN` / `OPERATOR` / `VIEWER`), xem ma trận quyền tại mục 4.0.3
* Hỗ trợ SSO qua Microsoft 365 (Azure AD / Entra ID) — OAuth 2.0 / OpenID Connect
* Mọi thao tác phải qua audit log (xem mục 4.6)
* Sensitive fields (password, key) không được lưu plain text, không hiển thị trong audit log value
* JWT short-lived + refresh token rotation; tự động logout khi không hoạt động

## Khả dụng

* Web-based UI (SPA)
* REST API với OpenAPI spec + **GraphQL API** (query linh hoạt + subscription realtime)
* Hỗ trợ export dữ liệu (CSV, JSON, PNG/SVG cho topology)

## Mở rộng

* Tích hợp SSH tool, Monitoring (Prometheus/Grafana), CI/CD pipeline

## Chuẩn hóa dữ liệu (Data Standardization)

* **Định dạng ngày**: `yyyy-MM-dd` (ví dụ: 2024-04-24) áp dụng cho toàn bộ hiển thị và input.
* **Định dạng thời gian**: `HH:mm` hoặc `HH:mm:ss` (nếu cần độ chính xác cao).
* **Múi giờ**: Lưu trữ UTC trong DB; hiển thị theo múi giờ địa phương (Local Time) tại UI.

---

# 🖥️ 6. Yêu cầu UI/UX

* **Trang đăng nhập**: form local login + nút "Đăng nhập bằng Microsoft 365" (ẩn nếu SSO bị disable)
* **Trang quản lý người dùng** (ADMIN): bảng user, filter theo nhóm/role/trạng thái, gán role/nhóm, khoá tài khoản, xem lịch sử đăng nhập
* **Trang quản lý nhóm** (ADMIN): danh sách UserGroup, thành viên từng nhóm, thêm/gỡ hàng loạt, thay đổi role mặc định nhóm
* **Trang Module Management** (`/admin/modules`, ADMIN only): bảng phân nhóm Core/Extended, toggle bật/tắt với kiểm tra dependency, timeline thay đổi
* **Dashboard tổng quan**: số server theo môi trường, trạng thái, cảnh báo (OS hết support, port conflict, thay đổi gần đây), ChangeSet đang Draft
* **Trang chi tiết server** (tab-based): Hardware / Network / Applications / Change History
* **Trang ứng dụng**: thông tin deploy (theo nhóm ứng dụng), upstream/downstream connections, port đang dùng
* **Trang deployment record**: thông tin quản lý (tiêu đề, CMC, người trình, ngày dự kiến/thực tế), checklist tài liệu với progress bar (X/Y loại COMPLETE), upload/preview file inline từng loại tài liệu
* **Topology view** (current):
  * Toggle chuyển đổi chế độ **2D / 3D** không mất trạng thái filter
  * 2D: force-directed graph, hỗ trợ layout tùy chọn, mini-map
  * 3D: xoay/zoom bằng chuột, nhóm node theo tầng, explode view theo môi trường/site
  * Edge màu theo trạng thái realtime (xanh/vàng/đỏ/xám), cập nhật qua GraphQL subscription
  * Node màu theo trạng thái server, pulse animation khi có thay đổi mới
  * Nút Export (PNG/SVG, Mermaid, JSON)
  * Nút "Tạo snapshot" và shortcut "So sánh với snapshot..."
* **Topology History view**:
  * Timeline snapshot (trục thời gian, chọn 1 hoặc 2 điểm)
  * Render graph tại thời điểm được chọn
  * Diff view khi chọn 2 snapshot: node/edge thêm (xanh) / xoá (đỏ) / đổi (vàng)
  * Export snapshot cũ
* **ChangeSet Manager**:
  * Danh sách ChangeSet, badge trạng thái (Draft / Applied / Discarded)
  * Trang chi tiết ChangeSet: danh sách ChangeItem dạng bảng + nút Preview / Apply / Discard
  * **Preview panel**: topology split-view (trái = hiện tại, phải = sau apply) hoặc overlay diff
  * Cảnh báo xung đột (port conflict, IP trùng) ngay trong preview
* **Audit log viewer**: bảng tra cứu với filter mạnh, diff viewer khi click vào 1 thay đổi
* Search toàn cục: nhập tên app / hostname / IP / domain → ra kết quả từ tất cả module

---

# 🔄 7. Use Cases chính

1. Thêm / sửa / xoá server — ghi audit log + tạo change snapshot
2. Deploy ứng dụng lên server (tạo AppDeployment record)
3. Tra cứu: **"Ứng dụng X đang chạy ở đâu và kết nối với gì?"**
4. Tra cứu: **"Server Y vừa thay đổi gì trong 7 ngày qua?"**
5. Xem topology kết nối toàn bộ hệ thống theo môi trường PROD
6. **Export sơ đồ kết nối** (PNG / Mermaid / JSON) để dùng trong tài liệu
7. Kiểm tra port conflict khi thêm port mới
8. Tìm kiếm theo domain → biết server và ứng dụng đang dùng domain đó
9. Xem audit log: ai đã xoá server / thay đổi cấu hình mạng
10. **Xem topology tại thời điểm 3 tháng trước** — chọn snapshot, render lại graph cũ
11. **So sánh topology tháng trước với hiện tại** — diff view, thấy ngay thay đổi
12. **Lập kế hoạch triển khai đợt mới** — tạo ChangeSet Draft, thêm các thay đổi, preview tác động, confirm apply
13. **Tạo deployment record** cho đợt triển khai — nhập tiêu đề, ngày dự kiến, CMC, người trình, upload tài liệu preview/final từng loại
14. **Kiểm tra hồ sơ tài liệu** — xem deployment nào còn thiếu tài liệu required trước ngày deploy dự kiến
15. **Lọc ứng dụng theo nhóm** — xem tất cả ứng dụng thuộc nhóm "Core Banking" đang chạy trên PROD
16. **Đăng nhập bằng Microsoft 365** — redirect sang Microsoft, đồng bộ thông tin, vào hệ thống với role đã gán
17. **Quản trị user**: Admin tạo tài khoản local, gán OPERATOR cho user mới, user nhận email kích hoạt
20. **Tạo nhóm mới**: Admin tạo nhóm "Vận hành ứng dụng" với role mặc định OPERATOR, thêm 5 user vào nhóm — các user được kế thừa quyền OPERATOR ngay lập tức
21. **Chuyển nhóm**: chuyển user từ nhóm PTUD sang CSHT — quyền cập nhật theo role mặc định của nhóm mới
18. **Bật module Topology 3D** — Admin vào Module Management, kiểm tra dependency, bật TOPOLOGY_3D, hiệu lực ngay lập tức
19. **Tắt module Import CSV** — Admin tắt, toàn bộ menu import bị ẩn với mọi user, ghi audit log

---

# 🧠 8. Yêu cầu nâng cao (Optional)

* Import cấu hình từ CSV / Excel
* Sync từ hệ thống thực tế (SSH Agent / auto-discovery)
* Alert khi: OS hết support, port conflict, IP trùng, không có thay đổi audit trong thời gian dài (stale data)
* Versioning cấu hình với khả năng rollback metadata (không rollback hạ tầng thực)
* Webhook / notification khi có thay đổi quan trọng (Slack, email)

---

# 🏗️ 10. Kiến trúc module & Lộ trình triển khai

## Nguyên tắc module hoá

* Mỗi module là một đơn vị **độc lập về dữ liệu, UI và API** — có thể deploy, bật/tắt mà không ảnh hưởng module khác
* Module phụ thuộc module khác phải khai báo rõ dependency (ví dụ: Topology phụ thuộc Server + Application)
* Tính năng trong mỗi module được chia thành **Core** (phải có) và **Extended** (tuỳ chọn, bật sau)
* Feature flag tập trung: quản trị viên bật/tắt từng module hoặc từng tính năng Extended qua config

## Phân loại module

| Module | Loại | Phụ thuộc |
|---|---|---|
| Auth & User Management | Core (không thể tắt) | — |
| Module Management | Core (không thể tắt) | Auth |
| Quản lý Server | Core | Auth |
| Quản lý Linh kiện | Core | Server |
| Quản lý Mạng | Core | Server |
| Nhóm ứng dụng (ApplicationGroup) | Core | Auth |
| Quản lý Phần mềm & Ứng dụng | Core | ApplicationGroup |
| Quản lý Port | Core | Application, Server |
| Audit Log | Core (không thể tắt) | Auth |
| Topology 2D | Extended | Server, Application, AppConnection |
| Topology 3D | Extended | Topology 2D |
| Topology Snapshot | Extended | Topology 2D, Audit Log |
| Realtime Status (GraphQL Subscription) | Extended | Topology 2D |
| ChangeSet Draft & Preview | Extended | Topology 2D, Audit Log |
| Hồ sơ tài liệu triển khai | Extended | AppDeployment |
| Cấu hình DeploymentDocType | Extended | Hồ sơ tài liệu |
| Change History & Diff view | Extended | Audit Log |
| Import CSV/Excel | Extended | Tất cả Core module |
| Sync SSH / Auto-discovery | Extended | Server |
| Alert & Notification | Extended | Audit Log, Port, Network |

## Lộ trình triển khai (Phased Rollout)

### Phase 1 — Nền tảng dữ liệu & Quản trị (Core)

Mục tiêu: xác thực, phân quyền, quản lý module và dữ liệu cơ bản.

- [x] **Auth**: đăng nhập local (username/password), JWT + refresh token, tự động logout
- [x] **Quản lý User**: CRUD user, gán role trực tiếp, khoá tài khoản, lịch sử đăng nhập
- [x] **Quản lý UserGroup**: CRUD nhóm (PTUD, VH_APP, CSHT, PTNV...), role mặc định nhóm, thêm/gỡ thành viên hàng loạt
- [x] **RBAC**: 3 role cố định (ADMIN / OPERATOR / VIEWER), quyền = union direct role + group role
- [x] **Module Management**: bật/tắt module qua UI, kiểm tra dependency, audit log thay đổi
- [x] Quản lý Server (CRUD, filter, tìm kiếm)
- [x] Quản lý Linh kiện
- [x] Quản lý Mạng (IP, domain, validate conflict)
- [x] Nhóm ứng dụng (ApplicationGroup)
- [x] Quản lý System Software & Business Applications
- [x] AppDeployment — thông tin cơ bản (app × server × env × version × trạng thái)
- [x] Quản lý Port + phát hiện conflict
- [x] Audit Log (ghi nhận mọi thao tác CRUD)
- [x] Dashboard tổng quan

> *Song song (Phase 1b):* Microsoft 365 SSO — có thể triển khai độc lập sau Phase 1.

### Phase 1b — Microsoft 365 SSO

Mục tiêu: đăng nhập bằng tài khoản tổ chức, không quản lý mật khẩu riêng.

- [ ] Tích hợp OAuth 2.0 / OpenID Connect với Azure AD / Entra ID
- [ ] Tự động đồng bộ tên, email, avatar từ Microsoft Graph API
- [ ] Account linking (email trùng với local account)
- [ ] Cấu hình Tenant ID, Client ID, allowed domains qua trang Admin Settings
- [ ] Option bắt buộc dùng Microsoft 365 (tắt local login)

### Phase 2 — AppConnection & Topology 2D

Mục tiêu: nhập liệu kết nối, hiển thị sơ đồ ngay khi dữ liệu sẵn sàng.

> Triển khai ngay sau Phase 1 — không cần chờ realtime hay 3D.

- [ ] AppConnection (CRUD, upstream/downstream, filter theo môi trường)
- [ ] Topology 2D — force-directed graph, filter theo môi trường/site
- [ ] Tra cứu nhanh: "App X ở đâu?", "Server Y chạy gì?", domain → app
- [ ] Export topology (PNG/SVG, Mermaid, JSON)

### Phase 3 — Hồ sơ tài liệu triển khai

Mục tiêu: quản lý đầy đủ thông tin và tài liệu cho mỗi đợt triển khai.

- [ ] Cấu hình DeploymentDocType (quản trị viên)
- [ ] AppDeployment — thông tin quản lý (tiêu đề, CMC, người trình, ngày dự kiến)
- [ ] Upload / preview tài liệu (preview file + final PDF) cho từng loại
- [ ] Checklist tài liệu, cảnh báo thiếu tài liệu required trước ngày deploy

### Phase 4 — Lịch sử & Kiểm soát thay đổi

Mục tiêu: kiểm soát lịch sử, so sánh và lập kế hoạch thay đổi.

- [ ] Change History — timeline, diff view trên từng đối tượng
- [ ] Topology Snapshot — tạo thủ công, tự động theo lịch
- [ ] So sánh 2 snapshot (diff graph: thêm/sửa/xoá highlight màu)
- [ ] ChangeSet Draft & Preview — tích luỹ thay đổi, preview tác động, confirm apply

### Phase 5 — Topology 3D

Mục tiêu: nâng cao trải nghiệm trực quan khi đã có đủ dữ liệu kết nối.

- [ ] Topology 3D — xoay/zoom, nhóm node theo tầng, explode view theo môi trường/site
- [ ] GraphQL API (Query + Mutation) — nếu chưa có từ Phase 2
- [ ] Toggle 2D/3D không mất trạng thái filter

### Phase 6 — Realtime Status (Thấp ưu tiên)

Mục tiêu: cập nhật trạng thái kết nối live — triển khai khi hạ tầng monitoring sẵn sàng.

- [ ] GraphQL Subscription — trạng thái kết nối & server realtime (WebSocket)
- [ ] Màu edge/node theo trạng thái live (HEALTHY / DEGRADED / DOWN / UNKNOWN)
- [ ] Tích hợp nguồn dữ liệu: Prometheus Alertmanager webhook hoặc custom health-check agent
- [ ] Fallback polling nếu WebSocket không khả dụng

### Phase 7 — Tích hợp & Tự động hoá (Optional)

Mục tiêu: giảm nhập tay, kết nối hệ thống ngoài.

- [ ] Import cấu hình từ CSV / Excel
- [ ] Sync từ SSH Agent / auto-discovery
- [ ] Alert & Notification (OS hết support, port conflict, IP trùng, stale data)
- [ ] Webhook tích hợp Slack / email
- [ ] Tích hợp Monitoring (Prometheus/Grafana), CI/CD

---

# 📦 9. Output mong muốn từ Agents

1. SRS (file này)
2. ERD Diagram (bao gồm `User`, `Role`, `UserGroup`, `ModuleConfig`, `AppDeployment`, `AppConnection`, `TopologySnapshot`, `ChangeSet`, `ChangeItem`, `AuditLog`, `ChangeHistory`)
3. API Design — REST (OpenAPI/Swagger) + GraphQL Schema (Query / Mutation / Subscription)
4. Database schema
5. Use case diagram
6. Sequence diagram — ưu tiên: Deploy app qua ChangeSet, Xem topology cũ, So sánh snapshot, Xem audit log
7. UI wireframe — ưu tiên: Dashboard, Topology view (current + history + diff), ChangeSet preview, Audit log viewer
