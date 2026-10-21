# HỆ THỐNG QUẢN LÝ ĐIỀU PHỐI VÀ NGHIỆM THU PHIẾU CÔNG VIỆC NỘI BỘ
> Đơn vị áp dụng thực tế: **CÔNG TY TNHH MTV ĐIỆN TỬ VIỄN THÔNG HOÀNG HIẾU**  
> Đồ án tốt nghiệp / Báo cáo thực tập doanh nghiệp ngành Công nghệ Thông tin.

---

## Giới thiệu dự án

Hệ thống hỗ trợ chuyển đổi số toàn diện quy trình tiếp nhận, điều phối, xử lý sự cố hiện trường và nghiệm thu thanh toán dịch vụ kỹ thuật (Camera giám sát, Hệ thống Mạng/Wi-Fi văn phòng và hộ gia đình). Ứng dụng giải quyết triệt để tình trạng thất thoát phiếu việc, quản lý lịch sử bảo hành phân tán và thiếu minh bạch trong tính toán doanh thu kỹ thuật.

---

## Tính năng nổi bật

### 1. Quản lý & Phân quyền người dùng (RBAC)
- **Phân vai trò chặt chẽ:** Điều phối viên (Admin) và Kỹ thuật viên hiện trường (Technician).
- **Vòng đời tài khoản an toàn (Soft Deactivation):** Cơ chế khóa/mở khóa tài khoản nhân viên mà không xóa dữ liệu khỏi MongoDB, bảo toàn 100% lịch sử phiếu việc và hồ sơ đối soát bảo hành.
- **Tự phục vụ:** Kỹ thuật viên chủ động đổi mật khẩu tài khoản cá nhân.

### 2. Tiếp nhận & Điều phối thông minh
- **Phân loại sự cố động:** Tự động thay đổi danh mục lỗi kỹ thuật theo từng hệ thống:
  - *Camera giám sát:* Lỗi thẻ nhớ/ổ cứng ghi hình, mất Wi-Fi, app offline, mất hồng ngoại ban đêm, di dời vị trí mắt cam.
  - *Hệ thống Mạng:* Mất tín hiệu quang, đứt cáp LAN, lỗi AP/Router, suy hao tín hiệu Wi-Fi.
- **Tra cứu lịch sử bảo hành theo SĐT:** Kiểm tra tức thì lịch sử các đơn sửa chữa cũ của khách hàng trước khi tạo phiếu mới.
- **Cơ chế tính phí linh hoạt:** Tự động miễn phí đối với thiết bị còn bảo hành; hỗ trợ bảng chọn nhanh biểu phí sửa chữa cho thiết bị ngoài bảo hành.

### 3. Nghiệm thu hiện trường & Tiện ích thực địa
- **Nhật ký vết xử lý (Audit Trail / Activity Timeline):** Ghi vết chi tiết từng cột mốc của phiếu (Ai thao tác – Vào thời điểm nào – Hành động gì – Ghi chú/số lượng ảnh đính kèm), đảm bảo tính toàn vẹn và chống chối bỏ.
- **Chỉ đường 1 chạm (Google Maps Universal Scheme):** Mở ứng dụng chỉ đường trực tiếp từ vị trí thợ đến tọa độ khách hàng.
- **Gọi điện nhanh (Click-to-Call):** Hỗ trợ kỹ thuật viên liên hệ trực tiếp khách hàng trên thiết bị di động.
- **Nghiệm thu kèm hình ảnh Cloudinary:** Upload biên bản nghiệm thu và ảnh hiện trường thực tế lên Cloudinary CDN.
- **In phiếu bảo trì / Biên bản nghiệm thu (Khổ A4):** Template in chuyên nghiệp, tự động ẩn thanh công cụ/thực đơn khi in (`print:hidden`), có đầy đủ chữ ký 2 bên.

### 4. Báo cáo quản trị & Kế toán đối soát
- **Dashboard thời gian thực:** Thống kê tỷ lệ hoàn thành, tổng doanh thu dịch vụ, phân bổ thiết bị (Camera vs Mạng), và bảng hiệu suất nghiệm thu từng kỹ thuật viên.
- **Xuất dữ liệu Excel (.xlsx):** Xuất sổ theo dõi đối soát doanh thu chi tiết kèm công thức tính tổng bằng SheetJS.

### 5. Kiến trúc Bảo mật (OWASP Standards)
- **Xác thực phiên làm việc kép:** Access Token ngắn hạn kết hợp Refresh Token lưu trong `HttpOnly`, `SameSite`, `Secure` Cookie.
- **Chống dò mật khẩu (Brute-Force Attack):** `express-rate-limit` chặn đăng nhập sau 5 lần thử sai từ cùng một địa chỉ IP.
- **Chống NoSQL Injection:** Middleware loại bỏ toàn bộ toán tử query nhạy cảm (`$`, `.`) trước khi đẩy vào database.
- **HTTP Header Security:** `helmet` bảo vệ ứng dụng, ẩn thông tin server, chống clickjacking và kiểm soát tài nguyên chéo (CORP).

---

## Công nghệ sử dụng (Tech Stack)

| Lớp kiến trúc | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, SheetJS (`xlsx`) |
| **Backend** | Node.js, Express.js (RESTful Architecture) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Storage & Cloud** | Cloudinary API (Lưu trữ ảnh hiện trường) |
| **DevOps & Container** | Docker, Docker Compose, Nginx Alpine Multi-stage Build |
| **Bảo mật** | JSON Web Token (JWT), Bcrypt, Helmet, Express Rate Limit |

---

## Cấu trúc thư mục

```text
hoang-hieu-dispatch-system/
├── client/                     # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Cấu hình Axios Client
│   │   ├── components/         # Modal đổi mật khẩu, Navbar, Sidebar...
│   │   ├── pages/              # Dashboard, Orders, CreateOrder, OrderDetail, Users
│   │   └── utils/              # Xuất Excel, định dạng tiền tệ VNĐ, ngày tháng
│   ├── nginx.conf              # Cấu hình máy chủ Nginx (SPA Routing)
│   ├── Dockerfile              # Dockerfile Multi-stage (Node Build -> Nginx Run)
│   └── vercel.json             # Cấu hình định tuyến chạy trên Vercel
├── server/                     # Backend API (Node.js + Express)
│   ├── config/                 # Kết nối MongoDB, Cloudinary
│   ├── controllers/            # Controller: Auth, Order, User, Dashboard
│   ├── middleware/             # Auth JWT, Role Guard, Rate Limiter, Sanitize
│   ├── models/                 # Mongoose Schema: User, WorkOrder
│   ├── routes/                 # Express REST Routes
│   ├── scripts/seed.js         # Khởi tạo dữ liệu mẫu ban đầu
│   └── Dockerfile              # Dockerfile Alpine chạy Backend
├── docker-compose.yml          # Điều phối chạy toàn bộ hệ thống bằng 1 lệnh
└── README.md