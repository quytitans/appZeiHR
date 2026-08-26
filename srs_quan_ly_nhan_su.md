# 1. Giới thiệu chung

## 1.1. Mục đích
Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) này mô tả các yêu cầu chức năng và phi chức năng cho hệ thống **Web App Quản lý Nhân sự (HRM Web App)**. Tài liệu này đóng vai trò là cơ sở để đội ngũ phát triển triển khai xây dựng từng phần và là tài liệu tham khảo cho các bên liên quan trong suốt vòng đời dự án.

## 1.2. Phạm vi sản phẩm
Hệ thống là một ứng dụng nền tảng web (Web Application) tập trung vào việc số hóa và tự động hóa các nghiệp vụ quản trị nguồn nhân lực cốt lõi trong doanh nghiệp, bao gồm: quản lý thông tin nhân sự, quản lý hợp đồng lao động, cấu hình và theo dõi phúc lợi, cùng hệ thống chấm công và quản lý các loại nghỉ phép linh hoạt.

## 1.3. Công nghệ sử dụng
- **Frontend:** React.js (Xây dựng giao diện Single Page Application - SPA, tối ưu hóa tốc độ tải trang và trải nghiệm người dùng).
- **Giao diện & Khả năng hiển thị:** Thiết kế Responsive hoàn toàn, tối ưu hiển thị mượt mà trên máy tính (Desktop/Laptop), máy tính bảng (Tablet) và điện thoại thông minh (Mobile Web), đảm bảo truy cập tiện lợi qua trình duyệt web mà không cần cài đặt ứng dụng native.
- **Backend & Database:** (Dự kiến xác định ở giai đoạn chi tiết tiếp theo - hỗ trợ RESTful API / GraphQL).

# 2. Mô tả tổng quan hệ thống

## 2.1. Phân quyền người dùng (User Roles)
| Vai trò | Mô tả & Phạm vi quyền hạn |
| :--- | :--- |
| **Nhân viên (Employee)** | Xem/cập nhật thông tin cá nhân, xem hợp đồng, theo dõi phúc lợi cá nhân, thực hiện chấm công, gửi yêu cầu nghỉ phép, nghỉ ốm, ngủ bù, nghỉ đẻ và theo dõi trạng thái duyệt. |
| **Quản lý trực tiếp (Line Manager)** | Xem thông tin nhân sự trong bộ phận, phê duyệt/từ chối các đơn từ (nghỉ phép, nghỉ ốm, ngủ bù...) của nhân viên cấp dưới. |
| **Quản trị nhân sự (HR Admin)** | Quản lý toàn bộ hồ sơ nhân sự, tạo và quản lý hợp đồng lao động, cấu hình phúc lợi, quản lý bảng chấm công tổng hợp và báo cáo nhân sự. |
| **Quản trị hệ thống (System Admin)** | Quản lý phân quyền, cấu hình hệ thống chung, bảo mật và phân quyền truy cập. |

# 3. Yêu cầu chức năng chi tiết (Functional Requirements)

## 3.1. Phân hệ Quản lý Hồ sơ Nhân sự (Personnel Profile Management - Giai đoạn 1)

### 3.1.1. Mục tiêu phân hệ
Xây dựng khung quản lý dữ liệu nhân sự nền tảng, cho phép HR thêm mới, tra cứu nhanh chóng qua từ khóa và quản lý các tệp tài liệu pháp lý (Hợp đồng lao động) trực tiếp trên giao diện Web App.

### 3.1.2. Yêu cầu chức năng chi tiết (Functional Requirements)

#### A. Thêm mới hồ sơ nhân sự (Create Profile)
- **Giao diện nhập liệu (Form):** Cung cấp màn hình/modal nhập liệu bao gồm các nhóm trường thông tin cốt lõi:
  - *Thông tin định danh:* Mã nhân viên (`employee_code`), Họ và tên (`full_name`), Giới tính, Ngày sinh, Số CCCD/CMND (`id_number`).
  - *Thông tin liên hệ:* Email công ty/cá nhân, Số điện thoại (`phone_number`).
  - *Thông tin công việc:* Phòng ban, Chức vụ, Ngày vào làm.
  - *Tài liệu đính kèm:* Cho phép tải lên file Hợp đồng lao động định dạng **PDF** (dung lượng tối đa theo cấu hình hệ thống).
- **Kiểm tra tính hợp lệ (Validation):**
  - Các trường bắt buộc (Mã nhân viên, Họ tên, Email, CCCD) không được để trống.
  - Hệ thống kiểm tra trùng lặp (Duplicate Check) đối với *Mã nhân viên* và *Số CCCD* để đảm bảo tính duy nhất.

#### B. Quản lý danh sách nhân sự (Employee List Management)
- **Hiển thị:**
  - *Trên Desktop:* Hiển thị dạng bảng (Data Table) gồm các cột: Ảnh đại diện, Mã NV, Họ tên, Email, Số điện thoại, Phòng ban, Trạng thái và Cột Hợp đồng.
  - *Trên Mobile:* Hiển thị dạng danh sách thẻ (Card list) rút gọn, tối ưu trải nghiệm chạm vuốt.
- **Phân trang & Sắp xếp:** Hỗ trợ phân trang (Pagination) theo số lượng bản ghi/trang (ví dụ: 10, 20, 50 bản ghi) và sắp xếp theo tên hoặc ngày vào làm.

#### C. Tìm kiếm thông minh On-change đa trường (Smart Real-time Search)
- **Cơ chế hoạt động:** Cung cấp 1 thanh tìm kiếm tổng quát (Global Search bar) ở đầu danh sách.
- **Sự kiện `onchange`:** Hệ thống tự động lọc dữ liệu ngay khi người dùng gõ từng ký tự (real-time), không cần bấm nút "Tìm kiếm".
- **Phạm vi và đặc tính tìm kiếm:**
  - **Không phân biệt chữ hoa/chữ thường (Case-insensitive):** Người dùng gõ chữ hoa (VD: `NGUYEN VAN A`) hay chữ thường đều trả về kết quả chính xác.
  - **Tìm kiếm tương đồng (Contains/Partial match):** Khớp chuỗi ký tự ở bất kỳ vị trí nào trong từ khóa.
  - **Đa trường thông tin (Multi-field search):** Bộ lọc tự động quét đồng thời trên các trường chính của nhân viên bao gồm:
    1. Mã nhân viên (`employee_code`)
    2. Họ và tên (`full_name`)
    3. Email (`email`)
    4. Số CCCD/CMND (`id_number`)

#### D. Liên kết hợp đồng lao động và Trình xem PDF (Contract Link & PDF Viewer)
- **Hiển thị Link Hợp đồng:**
  - Trong bảng danh sách nhân sự hoặc tại màn hình chi tiết, mỗi nhân viên có một cột/phần hiển thị liên kết (định dạng tên file hoặc dạng nút bấm "Xem hợp đồng") trỏ tới file Hợp đồng lao động đã tải lên.
- **Cửa sổ xem PDF trực tuyến (PDF Viewer Modal):**
  - Khi người dùng click vào link/nút hợp đồng của nhân sự tương ứng, hệ thống sẽ mở ra một cửa sổ popup (Modal) dạng nổi trên màn hình.
  - Tích hợp trình đọc file PDF trực tiếp (Embedded PDF Viewer) bên trong Modal, cho phép HR xem nội dung văn bản, phóng to/thu nhỏ hoặc chuyển trang ngay trên Web App mà không bắt buộc phải tải file về máy.
  - Có nút đóng cửa sổ (Icon `X` hoặc bấm ra vùng tối bên ngoài) và tùy chọn tải xuống (Download) nếu cần.

### 3.1.3. Yêu cầu kỹ thuật giao diện (Frontend - React)
- **State Management:** Sử dụng React Hooks (`useState`, `useMemo` hoặc `debounce`) để xử lý sự kiện `onchange` của ô tìm kiếm, đảm bảo hiệu năng mượt mà, không bị giật lag khi danh sách nhân sự lớn.
- **UI Components:** Sử dụng các thư viện UI phổ biến (như Ant Design, Tailwind UI, hoặc Material-UI) để đồng bộ Table, Modal, Input Search và PDF Reader component.

## 3.2. Phân hệ Quản lý Hợp đồng (Contract Management)
- **Quản lý loại hợp đồng:** Hợp đồng thử việc, hợp đồng xác định thời hạn, hợp đồng không xác định thời hạn, hợp đồng dịch vụ/thời vụ.
- **Tạo lập và theo dõi hợp đồng:** Lưu trữ thông tin số hợp đồng, ngày ký, ngày hiệu lực, ngày hết hạn, lương thỏa thuận và các phụ lục hợp đồng kèm theo.
- **Cảnh báo hết hạn hợp đồng:** Hệ thống tự động gửi thông báo/cảnh báo cho HR trước thời hạn hết hợp đồng (ví dụ: trước 30 ngày, 60 ngày) để kịp thời ký tiếp hoặc chấm dứt.

## 3.3. Phân hệ Quản lý Phúc lợi (Benefits Management)
- **Danh mục phúc lợi công ty:** Cấu hình các gói phúc lợi (bảo hiểm y tế/xã hội, bảo hiểm sức khỏe cao cấp, phụ cấp ăn trưa, đi lại, điện thoại, khám sức khỏe định kỳ).
- **Đăng ký và phân bổ phúc lợi:** Gán gói phúc lợi cho từng nhóm nhân viên hoặc cá nhân tương ứng với chính sách công ty.
- **Theo dõi lịch sử sử dụng:** Nhân viên tra cứu các khoản phúc lợi được hưởng và lịch sử sử dụng/thanh toán.

## 3.4. Phân hệ Chấm công và Quản lý Nghỉ phép (Attendance & Leave Management)
- **Chấm công trực tuyến:** Hỗ trợ chấm công qua Web App (ghi nhận thời gian check-in/check-out, kiểm tra vị trí GPS hoặc địa chỉ IP nếu cần).
- **Quản lý ngày phép năm:** Tự động tính toán số ngày phép tồn đọng, số phép được cấp hằng năm và số phép đã sử dụng.
- **Đăng ký và phê duyệt nghỉ phép linh hoạt:**
  - **Nghỉ phép năm / Nghỉ phép có lương:** Đăng ký theo ngày hoặc nửa ngày.
  - **Nghỉ ốm (Sick Leave):** Cập nhật giấy khám bệnh, trừ hoặc giữ nguyên lương tùy theo chính sách bảo hiểm và công ty.
  - **Ngủ bù (Compensation Leave / Overtime Leave):** Đăng ký nghỉ bù dựa trên thời gian làm thêm giờ (OT) đã tích lũy.
  - **Nghỉ đẻ / Chế độ thai sản (Maternity/Paternity Leave):** Quản lý thời gian nghỉ theo luật định cho nhân viên nữ và nam.
  - **Các hình thức nghỉ khác:** Nghỉ việc riêng, nghỉ không lương,...
- **Bảng tổng hợp công tháng:** Tổng hợp ngày công thực tế, đi muộn, về sớm, số công làm thêm và tổng hợp ngày nghỉ theo từng loại để làm căn cứ tính lương.

# 4. Yêu cầu phi chức năng (Non-Functional Requirements)

## 4.1. Giao diện và Khả năng đáp ứng (UI/UX & Responsive)
- Giao diện thiết kế theo chuẩn hiện đại, trực quan, dễ sử dụng (User-friendly).
- Tương thích tuyệt đối trên các trình duyệt phổ biến (Chrome, Safari, Firefox, Edge).
- Đáp ứng linh hoạt trên các thiết bị từ Desktop, Laptop, Tablet cho đến Smartphone (Responsive Design qua CSS Framework/Tailwind hoặc Bootstrap).

## 4.2. Hiệu năng và Bảo mật (Performance & Security)
- **Hiệu năng:** Tải trang nhanh nhờ cơ chế Single Page Application (SPA) của React, thời gian phản hồi API tối ưu dưới 2 giây cho các thao tác thông thường.
- **Bảo mật:** Mã hóa dữ liệu truyền tải (HTTPS), bảo mật thông tin cá nhân và hồ sơ nhân sự nhạy cảm theo phân quyền chặt chẽ (Role-Based Access Control - RBAC).
- **Sao lưu dữ liệu:** Cơ chế backup định kỳ để đảm bảo không mất mát dữ liệu nhân sự cốt lõi.

# 5. Kế hoạch triển khai và Phát triển tiếp theo
Tài liệu này là phiên bản tổng quan (Initial SRS) để xác định rõ bức tranh lớn và các phân hệ chính của hệ thống HRM Web App. Trong các giai đoạn tiếp theo, ý tưởng sẽ được cụ thể hóa thành:
- Chi tiết hóa sơ đồ luồng dữ liệu (Data Flow Diagrams) và quy trình phê duyệt (Approval Workflows).
- Đặc tả chi tiết từng màn hình giao diện (UI Wireframes/Mockups).
- Thiết kế cơ sở dữ liệu (Database Schema) cho từng phân hệ Hồ sơ, Hợp đồng, Phúc lợi và Chấm công.

# 6. Phụ lục: Trạng thái triển khai hiện tại (Implementation Snapshot)

> Mục này mô tả **những gì đã thực sự được xây dựng** trong code (không phải yêu cầu, mà là hiện trạng), để khi đổi máy tính / `git pull` về máy mới có thể dựng lại môi trường và biết chính xác đang ở đâu. Cập nhật lần cuối: 2026-08-26. Nếu mục này lệch với code thực tế, code là nguồn đúng — sửa lại mục này cho khớp.

## 6.1. Tên sản phẩm & bộ nhận diện
- Tên hiển thị: **Zei Group HR** (đổi từ "HRM Web App" ban đầu).
- Logo/favicon: mark chữ "Z" trên nền màu brand, xem `apps/frontend/public/favicon.svg` và icon `logo` trong `apps/frontend/src/components/ui/Icon.tsx`.
- Màu chủ đạo (brand color) toàn hệ thống: thang màu mint/ngọc lam, gốc `#4FC9A9`, định nghĩa tại `apps/frontend/tailwind.config.js` (`brand-50`→`brand-950`).

## 6.2. Công nghệ đã dùng thật (không còn là dự kiến)
- Backend: Python FastAPI + SQLAlchemy 2.0 + Alembic, chạy trên Python 3.12.
- Database: MySQL 8.
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + Zustand + axios.
- Hạ tầng dev: Docker Compose (`docker-compose.yml` ở gốc repo) — service `db`, `adminer`, `backend`, `frontend`.

## 6.3. Các phân hệ đã triển khai code (mức độ hoàn thiện)
- **3.1 Hồ sơ nhân sự — Giai đoạn 1: ĐÃ TRIỂN KHAI ĐẦY ĐỦ** theo đặc tả ở mục 3.1 phía trên (form thêm mới, danh sách desktop/mobile responsive, tìm kiếm real-time đa trường debounce, phân trang/sắp xếp, upload + xem PDF hợp đồng qua modal). Route frontend: `/personnel`. API backend: `app/modules/personnel/`.
- **3.2 Hợp đồng, 3.3 Phúc lợi, 3.4 Chấm công & Nghỉ phép:** đã có model dữ liệu + API CRUD cơ bản (`app/modules/contracts`, `app/modules/benefits`, `app/modules/attendance`), nhưng **frontend còn là trang placeholder** (`/contracts`, `/benefits`, `/attendance`) — chưa xây UI chi tiết như 3.1.
- **RBAC/Auth:** JWT + 4 vai trò (`employee`, `line_manager`, `hr_admin`, `system_admin`) hoạt động đầy đủ, `require_roles()` áp ở từng endpoint theo mục 2.1.
- **Quản trị hệ thống (System Admin):** mới có API quản lý user cơ bản (`app/modules/users`), frontend `/admin/users` còn là placeholder.

## 6.4. Cách dựng lại môi trường trên máy mới (sau khi `git pull`)

```bash
# 1. Cài Docker Desktop nếu máy mới chưa có, bật Docker Desktop.
# 2. Tạo file .env ở gốc repo (KHÔNG có trong git vì chứa secret) - copy mẫu rồi tự điền:
cp .env.example .env
# Sinh SECRET_KEY và mật khẩu MySQL mới, KHÔNG dùng lại giá trị mẫu:
python -c "import secrets; print(secrets.token_urlsafe(48))"   # -> dán vào SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(24))"   # -> dán vào MYSQL_ROOT_PASSWORD
python -c "import secrets; print(secrets.token_urlsafe(24))"   # -> dán vào MYSQL_PASSWORD (nhớ sửa luôn DATABASE_URL cho khớp)

# 3. Nếu cổng 8000/5173/3306 trên máy mới bị chiếm bởi project khác, đổi
#    BACKEND_PORT/FRONTEND_PORT/MYSQL_PORT trong .env (đồng thời sửa VITE_API_URL cho khớp
#    BACKEND_PORT mới) - xem ví dụ thực tế đã gặp: máy dev ban đầu phải đổi backend sang 8001
#    vì cổng 8000 bị 1 project khác (analytics_api) chiếm.

# 4. Dựng toàn bộ stack (tự chạy alembic upgrade head + seed admin mặc định khi backend khởi động):
docker compose up -d --build

# 5. Kiểm tra:
#    - Frontend:      http://localhost:5173 (hoặc FRONTEND_PORT đã đổi)
#    - Backend docs:   http://localhost:8001/docs (hoặc BACKEND_PORT đã đổi)
#    - Adminer (DB):   http://localhost:8080
#    - Đăng nhập: admin@hrm.local / Admin@123 (ĐỔI NGAY nếu đây là môi trường thật, không chỉ demo)
```

Nếu Alembic báo lỗi vì đã có migration cũ nhưng DB mới hoàn toàn trống, đó là luồng bình thường —
`alembic upgrade head` sẽ tự tạo toàn bộ bảng từ `apps/backend/alembic/versions/`. Không cần chạy
`Base.metadata.create_all()` thủ công (đã bỏ khỏi `scripts/seed.py`, xem `app/db/base.py`).

## 6.5. Vấn đề đã gặp và cách đã xử lý (tránh lặp lại khi setup máy mới)
- **`passlib` 1.7.4 lỗi `password cannot be longer than 72 bytes` khi hash mật khẩu:** do xung khắc với `bcrypt>=4.1`. Đã ghim `bcrypt==4.0.1` trong `apps/backend/requirements.txt` — không tự ý gỡ ghim này khi nâng cấp dependency.
- **`ImportError: email-validator is not installed`:** Pydantic `EmailStr` cần gói riêng. Đã thêm `email-validator==2.2.0` vào `requirements.txt`.
- **`InvalidRequestError: ... failed to locate a name ('Employee')` khi chạy `scripts/seed.py` độc lập:** do chỉ import `app.models.user` mà không load hết registry model. Script seed phải import `app.db.base` (import toàn bộ model) trước khi query — xem comment trong `scripts/seed.py`.

## 6.6. Việc còn thiếu để deploy lên hosting thật
Xem chi tiết đầy đủ trong `DEPLOYMENT.md` ở gốc repo (biến môi trường production, lưu ý `VITE_API_URL` bake lúc build, giải pháp lưu file PDF trên hosting ephemeral, quy trình chạy migration...). Tóm tắt nhanh: chưa có object storage cho file upload (đang lưu đĩa cục bộ), chưa tách "release command" (migration) khỏi "start command", chưa đổi mật khẩu admin mặc định.
