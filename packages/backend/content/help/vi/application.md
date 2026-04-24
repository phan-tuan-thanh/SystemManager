# Hướng dẫn Quản lý Ứng dụng & Deployment

Module **Quản lý Ứng dụng** giúp bạn theo dõi vòng đời của phần mềm, từ khi được khai báo cho đến khi triển khai (deploy) thực tế trên các server.

## Các khái niệm cơ bản

- **Ứng dụng (Application)**: Phần mềm nghiệp vụ chính.
- **Nhóm ứng dụng (AppGroup)**: Phân loại ứng dụng (ví dụ: Core Banking, Internal Tool).
- **Phần mềm hệ thống (System Software)**: OS, Middleware, Framework.
- **Deployment**: Bản ghi một ứng dụng cụ thể đang chạy trên một server cụ thể ở một môi trường nhất định.

## Các chức năng chính

### 1. Quản lý Ứng dụng
- Xem danh sách và lọc theo nhóm hoặc môi trường.
- Thêm mới ứng dụng với các thông tin: Mã, Tên, Phiên bản, Nhóm.

### 2. Quản lý Deployment
- Mỗi deployment đại diện cho trạng thái thực tế của ứng dụng trên server.
- Bạn có thể xem trạng thái (**Running**, **Stopped**, v.v.) của từng bản deploy.

### 3. Hồ sơ tài liệu triển khai (Compliance)
Đây là chức năng quan trọng để quản lý tính tuân thủ:
1. Vào chi tiết một Deployment.
2. Tại tab **Tài liệu**, bạn sẽ thấy danh sách các tài liệu cần nộp.
3. Upload **Bản nháp** hoặc **Bản chính thức (PDF)**.
4. Hệ thống sẽ báo hiệu tiến độ hoàn thành hồ sơ tài liệu.

## Ví dụ thực tế: Quản lý Microservices
- **Kịch bản**: Bạn đang quản lý hệ thống `E-Wallet` với hơn 50 microservices. Bạn cần kiểm tra xem các dịch vụ nào đang sử dụng port `8080`.
- **Thực hiện**:
    1. Vào danh sách **Ứng dụng**.
    2. Sử dụng ô tìm kiếm, nhập `8080`.
    3. Hệ thống lọc ra tất cả các ứng dụng có khai báo port này.
    4. Nhấn vào một ứng dụng (ví dụ: `Payment-Service`), xem tab **Deployments** để biết nó đang chạy trên server nào (ví dụ: `SRV-APP-01`, `SRV-APP-02`).
    5. Kiểm tra trạng thái hồ sơ tại tab **Tài liệu** để đảm bảo dịch vụ đã có đầy đủ hướng dẫn vận hành.

> [!IMPORTANT]
> Đối với môi trường **PROD**, hệ thống yêu cầu đầy đủ các tài liệu bắt buộc trước khi ghi nhận trạng thái hoàn tất hồ sơ.
