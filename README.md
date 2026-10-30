# HỆ THỐNG QUẢN LÝ ĐIỀU PHỐI VÀ NGHIỆM THU PHIẾU CÔNG VIỆC NỘI BỘ
> Đơn vị áp dụng thực tế: **CÔNG TY TNHH MTV ĐIỆN TỬ VIỄN THÔNG HOÀNG HIẾU**  
> Đồ án tốt nghiệp / Báo cáo thực tập doanh nghiệp ngành Công nghệ Thông tin.

---

## Giới thiệu dự án

Hệ thống hỗ trợ chuyển đổi số toàn diện quy trình tiếp nhận, điều phối, xử lý sự cố hiện trường và nghiệm thu thanh toán dịch vụ kỹ thuật (Camera giám sát, Hệ thống Mạng/Wi-Fi văn phòng và hộ gia đình). Ứng dụng giải quyết triệt để tình trạng thất thoát phiếu việc, quản lý lịch sử bảo hành phân tán và thiếu minh bạch trong tính toán doanh thu kỹ thuật.

---

## Trải nghiệm trực tuyến & Tài khoản Demo

- **Ứng dụng Web trực tuyến:** https://hoang-hieu-dispatch-system.vercel.app
- **Máy chủ Backend API:** https://hoang-hieu-api.onrender.com

Hệ thống đã thiết lập sẵn 2 tài khoản mẫu đại diện cho 2 vai trò nghiệp vụ (RBAC) để hội đồng nghiệm thu và trải nghiệm tính năng:

| Vai trò | Tên đăng nhập | Mật khẩu | Phạm vi quyền hạn trải nghiệm |
| :--- | :--- | :--- | :--- |
| **Điều phối viên (Admin)** | admin | Admin@123 | Toàn quyền quản trị: Giám sát Dashboard, tạo & phân công phiếu việc, khóa/mở tài khoản nhân sự, xem Báo cáo phân tích xu hướng và xuất sổ đối soát Excel (.xlsx). |
| **Kỹ thuật viên (Technician)** | tech_nam | Tech@123 | Giao diện tối ưu Mobile: Xem danh sách phiếu được phân công, mở Google Maps chỉ đường, gọi điện cho khách, cập nhật tiến độ và tải ảnh nghiệm thu thực địa. |

> **Lưu ý:** Để trải nghiệm giao diện Kỹ thuật viên trực quan nhất, khuyến khích mở trên trình duyệt điện thoại di động hoặc bật chế độ Device Toolbar (F12) trên trình duyệt máy tính.

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

### 4. Phân tích Dữ liệu, Đánh giá KPI & Đối soát Tài chính
- **Dashboard Giám sát (Real-time Snapshot):** Theo dõi tức thời luồng trạng thái phiếu việc trong ngày, tổng số công việc và doanh thu dịch vụ.
- **Phân tích Xu hướng & Đề xuất vận hành (Rule-based Analytics):** Tự động phân tích dữ liệu lịch sử phiếu việc để xác định nhóm thiết bị hỏng nhiều nhất, thống kê top sự cố kỹ thuật chi tiết (mất nguồn, mờ/nhiễu, đứt cáp...) và đưa ra khuyến nghị tồn kho vật tư hoặc cảnh báo tỷ lệ bảo hành vượt ngưỡng.
- **Đánh giá Hiệu suất Kỹ thuật viên (KPI):** Bảng xếp hạng KPI nhân sự chi tiết (số phiếu giao, đang xử lý, đã nghiệm thu, phân bổ đơn BH/thu phí, tổng doanh thu mang về, tỷ lệ hoàn thành kèm thanh tiến độ và xếp loại tự động).
- **Sổ cái & Đối soát Doanh thu:** Bộ lọc đa chiều tương tác theo thời gian (tùy chỉnh ngày), loại thiết bị và chế độ bảo hành. Bảng sổ cái đối soát phiếu việc chi tiết có dòng tổng cộng doanh thu và hỗ trợ in ấn mẫu A4 chuyên nghiệp.
- **Xuất báo cáo Excel (.xlsx):** Tích hợp thư viện SheetJS xuất báo cáo đối soát đa trang tính tự động tính toán số liệu kế toán.

### 5. Kiến trúc Bảo mật Đa lớp (OWASP Standards)
- **Kiểm soát truy cập & Phân quyền (RBAC - Broken Access Control Prevention):** Phân định chặt chẽ quyền hạn giữa Điều phối viên và Kỹ thuật viên; middleware kiểm tra trạng thái kích hoạt tài khoản (`isActive`) thời gian thực và bảo vệ quyền sở hữu phiếu việc.
- **Xác thực phiên kép an toàn (Dual-Token JWT):** Access Token ngắn hạn kết hợp Refresh Token lưu trong `HttpOnly`, `SameSite`, `Secure` Cookie chống đánh cắp phiên qua tấn công XSS.
- **Chống dò quét mật khẩu (Brute-Force Protection):** Tích hợp `express-rate-limit` chặn request sau 5 lần thử đăng nhập sai liên tiếp từ cùng một địa chỉ IP.
- **Lọc dữ liệu chống NoSQL Injection:** Middleware tự động kiểm tra và loại bỏ các toán tử truy vấn nhạy cảm (`$`, `.`) trong body, params và query trước khi xử lý tại cơ sở dữ liệu.
- **Bảo mật HTTP Headers (Helmet):** Ẩn chữ ký máy chủ (`X-Powered-By`), chống Clickjacking, bảo vệ MIME-type sniffing và kiểm soát tài nguyên chéo (CORP).
- **Kiểm soát nguồn gốc tên miền (CORS Whitelist):** Giới hạn chỉ chấp nhận các yêu cầu hợp lệ xuất phát từ domain client được chỉ định trên môi trường sản xuất.

---

## Công nghệ sử dụng

| Lớp kiến trúc | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, SheetJS (`xlsx`) |
| **Backend** | Node.js, Express.js (RESTful Architecture) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Storage & Cloud CDN** | Cloudinary API (Lưu trữ ảnh nghiệm thu thực tế) |
| **DevOps & Triển khai** | Docker, Docker Compose, Nginx Multi-stage / **Vercel** (Frontend) / **Render** (Backend) |
| **Bảo mật (OWASP)** | Dual-Token JWT (HttpOnly Cookie), Bcrypt, Helmet, Express Rate Limit, NoSQL Injection Filter, CORS Whitelist |

---

## Cấu trúc thư mục

```text
hoang-hieu-dispatch-system/
├── client/                     # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Cấu hình Axios Client
│   │   ├── components/         # Modal đổi mật khẩu, Navbar, Sidebar...
│   │   ├── pages/              # DashboardPage, OrdersPage, CreateOrderPage, OrderDetailPage, UsersPage, ReportsPage.jsx
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