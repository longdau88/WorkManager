# WorkManager - Hệ thống Quản lý Công việc & Dự án

WorkManager là hệ thống quản lý công việc và tiến độ dự án chuyên nghiệp, kiến trúc phân tách rõ ràng giữa **Backend REST API (Node.js/Express theo chuẩn Clean Architecture)** và **Frontend hiện đại (Vanilla HTML5/CSS3/ES6)**.

---

## 📁 Cấu trúc thư mục dự án

```text
WorkManager/
├── docker-compose.yml           # Khởi chạy PostgreSQL 16 & pgAdmin 4
├── package.json                 # Scripts quản lý toàn bộ hệ thống
├── README.md                    # Tài liệu hướng dẫn sử dụng và triển khai
│
├── server/                      # BACKEND (Node.js + Express + Prisma + Multer)
│   ├── .env                     # Cấu hình môi trường (Port, Database URL, v.v.)
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma        # CSDL PostgreSQL (Project, Task, Member, Field)
│   ├── database/
│   │   └── init.sql             # Script SQL khởi tạo schema & trường dữ liệu mẫu
│   ├── uploads/                 # Thư mục lưu trữ tệp & tài liệu đính kèm
│   └── src/
│       ├── server.js            # Khởi động server & đóng kết nối an toàn
│       ├── app.js               # Cấu hình Express, CORS, Static files & Middlewares
│       ├── config/
│       │   ├── env.js           # Quản lý biến môi trường
│       │   └── db.js            # Kết nối PostgreSQL (Prisma) & Fallback Store
│       ├── validators/          # Xác thực dữ liệu bằng Zod (Projects, Tasks, Members, Fields, Sync)
│       ├── middlewares/
│       │   ├── validate.js      # Middleware validate Zod schema
│       │   └── errorHandler.js  # Global error handling chuẩn JSON response
│       ├── repositories/        # Data Access Layer (Tương tác CSDL qua Prisma)
│       ├── services/            # Business Logic Layer
│       ├── controllers/         # HTTP Controller Layer ({ status, message, data })
│       └── routes/              # Express Routers (/projects, /tasks, /members, /fields, /sync, /upload)
│
├── client/                      # FRONTEND (Single Page Application hiện đại)
│   ├── index.html               # Semantic HTML5, SEO meta tags, Google Font Inter
│   ├── css/
│   │   ├── variables.css        # Hệ thống Design Tokens (8pt Grid, Bảng màu HSL Light/Dark)
│   │   ├── base.css             # Reset CSS, Typography & Custom scrollbar
│   │   ├── components.css       # Buttons, Badges, Modals, Inputs, Cards, Tables
│   │   ├── layout.css           # Header, Sidebar, Task Lists & Responsive Grid
│   │   └── animations.css       # Micro-interactions & Hiệu ứng chuyển động
│   └── js/
│       ├── config.js            # Hằng số, API config & Template mẫu (Cơ bản, Tích hợp, Cung cấp)
│       ├── api.js               # Fetch API wrapper cho REST endpoints & File upload
│       ├── state.js             # State Management, Optimistic UI, Queue Sync & Timezone Safety
│       ├── app.js               # Điều phối giao diện, Event listeners & Keyboard shortcuts
│       └── components/
│           ├── projects.js      # Render sidebar dự án & thẻ chi tiết dự án
│           ├── tasks.js         # Render danh sách công việc, phân nhóm & Kéo thả (SortableJS)
│           ├── modal.js         # Modal Tạo/Sửa Công việc, Dự án, Cài đặt Thành viên & Trường thông tin
│           └── stats.js         # Thống kê KPI, Ma trận tiến độ & Xuất file CSV (Excel)
│
└── Code/                        # Mã nguồn Google Apps Script gốc (lưu trữ làm tài liệu tham chiếu)
    ├── Code.gs
    └── Index.html
```

---

## 🚀 Hướng dẫn khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: >= 18.x
- **Docker** *(tùy chọn)*: Để chạy PostgreSQL & pgAdmin cục bộ.
  > *Lưu ý: Nếu chưa cài đặt Docker hoặc PostgreSQL, hệ thống tự động kích hoạt **Local Fallback Store** để bạn có thể chạy và trải nghiệm ngay lập tức mà không gặp lỗi kết nối CSDL.*

### 2. Cài đặt và chạy ứng dụng

```bash
# 1. Cài đặt dependencies cho backend
cd server
npm install

# 2. Khởi động server
npm start
# hoặc chạy ở chế độ dev (tự động reload khi sửa code):
npm run dev
```

Sau khi khởi động:
- 🌐 **Web App:** [http://localhost:5000](http://localhost:5000)
- 📡 **API Base URL:** [http://localhost:5000/api](http://localhost:5000/api)
- 🩺 **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🐬 Kết nối Cơ sở dữ liệu MySQL

Hệ thống đã được kết nối trực tiếp với máy chủ MySQL:
- **Host:** `mysql-tlcserver.alwaysdata.net` (Port `3306`)
- **Database:** `tlcserver_work_manager`
- **User:** `tlcserver`
- **Quản lý qua phpMyAdmin:** [https://phpmyadmin.alwaysdata.com](https://phpmyadmin.alwaysdata.com)

Chuỗi kết nối mẫu:
```env
DATABASE_URL="mysql://<USER>:<PASSWORD>@<HOST>:3306/<DATABASE>"
```

Khi dự án được kết nối lần đầu với một CSDL trống, hệ thống sẽ **tự động khởi tạo đầy đủ Schema** (các bảng `Project`, `Task`, `Member`, `Field`) và **nạp sẵn dữ liệu mẫu ban đầu** (10 trường thông tin kỹ thuật, tài khoản quản trị mặc định và dự án mẫu hoàn chỉnh).


---

## 🔐 Hệ thống Đăng nhập & Phân quyền (RBAC)

Hệ thống tích hợp xác thực JWT bảo mật và phân quyền linh hoạt theo 2 cấp độ: **Quyền hạn hệ thống (System Roles & Permissions)** và **Phân quyền theo từng dự án (Project-level Permissions)**.

### 1. Tài khoản Quản trị viên (Admin) mặc định
Khi khởi động hệ thống lần đầu, tài khoản quản trị mặc định sẽ được tự động kích hoạt:
- **Tên đăng nhập (Username):** `admin`
- **Mật khẩu (Password):** `admin123`

### 2. Giao diện Admin đồng nhất (Seamless User Interface)
- Khi đăng nhập bằng tài khoản `admin`, giao diện làm việc **hoàn toàn đồng nhất** với các vai trò thông thường (sidebar dự án, danh sách công việc kéo thả, thẻ tiến độ, bộ lọc, xem thống kê).
- Tính năng quản trị được tích hợp mượt mà:
  - Nút **`⚙ Cài đặt`** trên thanh tiêu đề mở rộng thêm 2 tab quản trị đặc quyền: **`👤 Tài khoản`** và **`🛡️ Vai trò & Phân quyền`**.
  - Mỗi thẻ dự án bổ sung nút **`🔒 Phân quyền`** để cấu hình quyền truy cập của các tài khoản vào dự án đó.

### 3. Quản lý Tài khoản (User Management)
- Xem danh sách toàn bộ người dùng trong hệ thống kèm trạng thái và vai trò.
- Thêm mới tài khoản: Đặt Username, Họ tên, Email, Mật khẩu, gán Vai trò (Role).
- Chỉnh sửa thông tin, đặt lại mật khẩu mới hoặc Khóa/Kích hoạt tài khoản.
- Xóa tài khoản (bảo vệ tài khoản `admin` gốc khỏi bị xóa nhầm).

### 4. Quản lý Vai trò & Phân quyền hệ thống (Roles & Permissions)
- Hệ thống định nghĩa sẵn 4 vai trò:
  - 👑 **Quản trị viên (Admin):** Toàn quyền hệ thống và toàn bộ dự án.
  - 💼 **Quản lý dự án (Manager / PM):** Tạo dự án mới, phân quyền dự án do mình quản lý.
  - 👤 **Thành viên (Member):** Thực hiện công việc được giao trong dự án được phân quyền.
  - 👁️ **Khách (Viewer):** Chỉ xem nội dung các dự án được cấp quyền.
- Admin có thể **tạo thêm vai trò mới** hoặc **chỉnh sửa vai trò hiện có**, tích chọn các quyền hạn:
  - `manage_users`: Quản lý người dùng (thêm, sửa, khóa tài khoản).
  - `manage_roles`: Quản lý danh sách vai trò và phân bổ quyền hạn hệ thống.
  - `create_project`: Tạo dự án mới.
  - `delete_project`: Xóa dự án.
  - `edit_all_projects`: Chỉnh sửa mọi dự án mà không cần gán quyền riêng.
  - `manage_project_permissions`: Phân quyền người dùng vào từng dự án.
  - `export_stats`: Xuất báo cáo thống kê CSV.

### 5. Phân quyền từng tài khoản cho từng dự án (Project Access Levels)
- Tại mỗi dự án, Admin hoặc Quản lý dự án có thể nhấn **`🔒 Phân quyền`** để chọn mức truy cập cụ thể cho từng tài khoản:
  - 👑 **Chủ sở hữu (Owner):** Toàn quyền quản trị nội dung và phân quyền dự án.
  - ✏️ **Chỉnh sửa (Editor):** Thêm mới, cập nhật trạng thái, tiến độ và hạn chót công việc.
  - 👁️ **Chỉ xem (Viewer):** Chỉ được xem danh sách công việc và thông tin dự án (chỉ đọc).
  - 🚫 **Không truy cập (None):** Tài khoản sẽ không nhìn thấy và không thể truy cập vào dự án này.

---

## 🌟 Các tính năng nổi bật

1. **Quản lý công việc thông minh:**
   - Hỗ trợ phân nhóm theo Hạng mục (Folder).
   - Đánh mã tự động (1.1, 1.2, 2.1...).
   - Đánh dấu mức độ ưu tiên (`Cao`, `Trung bình`, `Thấp`).
   - Cảnh báo thời hạn: `Hôm nay`, `Sắp hạn`, `Quá hạn`.
   - Kéo thả mượt mà để đổi thứ tự công việc và hạng mục bằng **SortableJS**.
2. **Quản lý dự án toàn diện:**
   - Tùy biến màu sắc đại diện cho từng dự án.
   - Hỗ trợ khai báo các trường thông tin kỹ thuật/hợp đồng tùy biến (Chủ đầu tư, Số hợp đồng, Giá trị, Số lượng thiết bị...).
   - Bộ mẫu hạng mục có sẵn (Cơ bản 5 hạng mục, Tích hợp hệ thống/Camera 10 hạng mục, Cung cấp hàng hóa 6 hạng mục).
3. **Thống kê & Báo cáo chuyên sâu:**
   - Thẻ KPI tổng quan: Tổng dự án, Tổng đầu việc, Tiến độ chung, Quá hạn, Sắp hạn.
   - Cộng tổng tự động các trường kiểu Số và thống kê trường kiểu Lựa chọn.
   - Ma trận nhiệt (Heatmap) tiến độ theo từng hạng mục của các dự án.
   - Thống kê khối lượng công việc theo từng người nhận việc.
   - **Xuất báo cáo ra định dạng CSV (Excel)** chỉ với 1 cú click.
4. **Trải nghiệm người dùng cao cấp:**
   - Hỗ trợ **Chế độ Sáng / Tối (Dark / Light Theme)**.
   - Thiết kế theo hệ thống lưới **8pt Grid System** cân đối, hiện đại.
   - Cơ chế **Offline-First / Optimistic UI** giúp thao tác tức thì không có độ trễ.
5. **Giao diện đáp ứng đa nền tảng (Fully Responsive):**
   - Tối ưu cho mọi kích thước màn hình: **Desktop PC / Màn hình siêu rộng**, **Màn hình chia đôi (Split-screen 960px)**, **Máy tính bảng (iPad / Tablet)** và **Điện thoại di động (Mobile Phones)**.
   - Thanh dự án dạng thanh vuốt ngang (horizontal carousel) mượt mà trên màn hình nhỏ.
   - Các hộp thoại (Modals) tự động chuyển sang phong cách **Bottom-Sheet** trên điện thoại với thanh hành động (Lưu/Đóng) cố định tiện dụng.
   - Cỡ chữ ô nhập liệu được chuẩn hóa 16px trên di động để chống hiện tượng tự động phóng to (auto-zoom) trên iOS Safari.

## 🧭 Lộ trình cập nhật từ V10

Đã đối chiếu `V10/Code.gs` và `V10/Index.html` với ứng dụng Node.js hiện tại. Các module ERP chính của V10 đã có tương đương; các phần dưới đây là những khác biệt cần hoàn thiện.

### Đã cập nhật trong đợt này

- **Phân quyền dữ liệu ERP ở backend:** bootstrap chỉ trả về dữ liệu thuộc dự án được cấp quyền; sync từ chối ghi dữ liệu dự án ngoài phạm vi hoặc quyền chỉ xem.
- **Trao đổi theo task:** thêm `Comment` vào bootstrap, cache, hàng đợi offline và modal báo cáo tiến độ.
- **Audit snapshot:** mỗi thao tác sync hợp lệ lưu bản trước/sau vào `AuditLog`; thêm `GET /api/audit` cho tài khoản có quyền `view_audit`.

### Các giai đoạn tiếp theo

1. **Khôi phục và backup:** thêm màn hình lịch sử, endpoint restore có transaction, backup định kỳ và retention; chỉ Admin/Manager được thao tác.
2. **Nhắc việc và email:** scheduler cho deadline, bảo lãnh, đợt thanh toán và issue quá hạn; thêm chống gửi trùng và nhật ký gửi.
3. **Xuất hồ sơ:** báo cáo tuần, nhật ký, thiết bị, nghiệm thu và lỗi ở DOCX/PDF; giữ CSV hiện có làm định dạng dữ liệu.
4. **Presence/thông báo:** unread count, trạng thái online và polling hoặc SSE cho bình luận/task.
5. **OTP email:** chỉ triển khai sau khi chốt nhà cung cấp email, chính sách hết hạn phiên và phương án fallback cho môi trường offline.

### Tiêu chí nghiệm thu

- User không thuộc dự án không nhận được dữ liệu ERP của dự án đó và không thể ghi bằng cách gọi API trực tiếp.
- Comment hiển thị sau lần đồng bộ kế tiếp, hoạt động khi offline và từ chối comment vào task ngoài quyền.
- Audit lưu được người thao tác, loại bản ghi, hành động, project và snapshot trước/sau.
- Mọi scheduler/export phải có kiểm thử quyền, chống lặp và kiểm thử trên fallback store trước khi bật production.

### Trạng thái triển khai bổ sung

- Backup snapshot JSON, retention, checksum, restore fallback và restore MySQL transaction: `POST /api/backup`, `POST /api/backup/:filename/restore`.
- Scheduler theo `SCHEDULER_CRON` và `BACKUP_CRON`, mặc định nhắc mỗi 15 phút và backup lúc 02:00 theo `APP_TIMEZONE`.
- Notification unread cho deadline task/project, issue, bảo lãnh và khoản thanh toán: `/api/notifications`.
- Báo cáo server-side: `/api/exports/report.docx` và `/api/exports/report.pdf`.
- Presence heartbeat và SSE realtime: `/api/realtime/presence`, `/api/realtime/events`.

Sau khi cập nhật schema trên môi trường có database, chạy `npm run db:push` hoặc tạo migration trước khi bật production.

---

## ☁️ Hướng dẫn Triển khai lên Vercel (Deployment Guide)

Dự án đã được cấu hình sẵn tệp [vercel.json](file:///e:/Web/Project/WorkManager/vercel.json) và Serverless Function Handler [api/index.js](file:///e:/Web/Project/WorkManager/api/index.js).

### Các bước triển khai trong 3 phút:

1. **Đăng nhập vào Vercel:**
   - Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn (`longdau88`).

2. **Tạo New Project:**
   - Chọn **Add New...** ➔ **Project**.
   - Tìm kho lưu trữ **`WorkManager`** và nhấn **Import**.

3. **Cấu hình Project Settings:**
   - **Framework Preset:** Chọn `Other` (mặc định).
   - **Root Directory:** Để nguyên mặc định `./` (không chọn thư mục `server`).
   - **Build Command:** Để nguyên mặc định (Vercel tự động thực thi `prisma generate --schema=server/prisma/schema.prisma`).
   - **Output Directory:** Để nguyên mặc định.

4. **Thêm các Biến môi trường (Environment Variables):**
   Mở phần **Environment Variables** và thêm các biến sau:
   | Tên biến | Giá trị gợi ý |
   | :--- | :--- |
   | `DATABASE_URL` | `mysql://<USER>:<PASSWORD>@<HOST>:3306/<DATABASE>` |
   | `JWT_SECRET` | `workmanager_super_secret_jwt_key_2026_tlc` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |

5. **Nhấn Deploy:**
   - Vercel sẽ tự động tải dependencies, chạy `prisma generate` và kích hoạt ứng dụng trên tên miền miễn phí dạng: `https://work-manager-xxx.vercel.app`.
   - CSDL MySQL AlwaysData sẽ tự động đồng bộ tài khoản `admin` / `admin123` và toàn bộ dữ liệu dự án!