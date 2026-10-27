# Zei OXA v1.0 — Đặc tả Yêu cầu Phần mềm (SRS)

> **Phiên bản tài liệu:** 2026-10-27
>
> **Cấu trúc tài liệu:**
> - **Mục 1–5:** *yêu cầu* của hệ thống (cái hệ thống phải làm).
> - **Mục 6:** *hiện trạng code*, tức những gì đã thực sự được xây dựng. Luôn đọc mục 6 trước khi bắt đầu làm việc với repo.
>
> **Quy ước giữ số mục:** số mục 3.1.2.A–D, 3.4.1, 3.4.2 được tham chiếu trong code và README, nên khi chỉnh sửa tài liệu **không đánh số lại** các mục này.

---

# 1. Giới thiệu chung

## 1.1. Mục đích
Tài liệu này mô tả yêu cầu chức năng và phi chức năng cho **Zei OXA v1.0**, nền tảng web vận hành doanh nghiệp nội bộ của Zei Group. Tài liệu dùng cho hai mục đích:
- Làm cơ sở để đội phát triển xây dựng từng phân hệ.
- Làm tài liệu tham chiếu chung cho các bên liên quan trong suốt vòng đời dự án.

## 1.2. Phạm vi sản phẩm
Zei OXA số hóa các nghiệp vụ vận hành nội bộ trên cùng một nền tảng:
- **Nhân sự:** hồ sơ nhân viên, tài liệu đính kèm, dữ liệu nền (phòng ban, chức vụ).
- **Hợp đồng lao động** và **phúc lợi**.
- **Chấm công & nghỉ phép:** ticket nghỉ duyệt nhiều cấp, quỹ ngày nghỉ theo loại.
- **Quản lý tài sản** cấp phát cho nhân viên (dự kiến).
- **Quản trị hệ thống:** tài khoản, phân quyền.

## 1.3. Công nghệ
| Lớp | Công nghệ |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + Zustand (SPA) |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic (RESTful API, JWT) |
| Database | MySQL 8 |
| Hạ tầng dev | Docker Compose (`db`, `adminer`, `backend`, `frontend`) |

Giao diện responsive cho Desktop, Tablet và Mobile Web; dùng qua trình duyệt, không cần cài ứng dụng native.

# 2. Mô tả tổng quan hệ thống

## 2.1. Phân quyền người dùng (RBAC Roles)
Mỗi tài khoản có **đúng 1 vai trò**. Vai trò quyết định *được truy cập chức năng nào*.

| Vai trò | Mã | Phạm vi quyền hạn |
| :--- | :--- | :--- |
| **Nhân viên** | `employee` | Xem hồ sơ; gửi ticket nghỉ phép và theo dõi trạng thái; xem quỹ ngày nghỉ và chấm công của mình. |
| **Quản lý trực tiếp** | `line_manager` | Như Nhân viên, cộng thêm xử lý ticket của cấp dưới khi được chọn làm người duyệt (xem mục 2.2 và 3.4.1). |
| **Quản trị nhân sự** | `hr_admin` | Quản lý toàn bộ hồ sơ nhân sự, tài liệu, Master Data, hợp đồng, phúc lợi; xem mọi ticket và chấm công toàn công ty; cấu hình quỹ ngày nghỉ. |
| **Quản trị hệ thống** | `system_admin` | Toàn bộ quyền của HR, cộng thêm quản lý tài khoản, phân quyền và cấu hình hệ thống. |

## 2.2. Cấp duyệt tổ chức (Approval Level)
**Quyền duyệt ticket nghỉ** được xác định bởi **cấp duyệt** của người đó trong tổ chức, *không* phụ thuộc vai trò RBAC. Hai yếu tố tạo nên cấp duyệt:

- **Cấp duyệt gắn theo Chức vụ** (cấu hình ở Master Data, mục 3.5). Có 4 cấp: `Nhân viên` < `Trưởng phòng` < `Giám đốc` < `CEO`.
- **Chuỗi quản lý trực tiếp:** mỗi hồ sơ nhân viên có trường *Quản lý trực tiếp*, tạo thành chuỗi nhân viên → trưởng phòng → giám đốc → CEO. Hệ thống dùng chuỗi này để điền sẵn người duyệt mặc định.

**Ví dụ:** một kế toán viên có vai trò `employee` và cấp duyệt `Nhân viên`. Trưởng phòng Kế toán có vai trò `line_manager` và cấp duyệt `Trưởng phòng`, vì chức vụ của họ là "Trưởng phòng".

## 2.3. Danh sách phân hệ
| Mục | Phân hệ | Route frontend | Trạng thái (chi tiết ở mục 6.3) |
|---|---|---|---|
| 3.1 | Hồ sơ nhân sự | `/personnel`, `/personnel/:id` | Đã triển khai |
| 3.2 | Hợp đồng | `/contracts` | Có API cơ bản, UI là trang chờ |
| 3.3 | Phúc lợi | `/benefits` | Có API cơ bản, UI là trang chờ |
| 3.4 | Chấm công & Nghỉ phép | `/attendance` | Ticket nghỉ + workflow + quỹ ngày nghỉ đã triển khai |
| 3.5 | Master Data | `/master-data` | Đã triển khai |
| 3.6 | Quản lý tài sản | `/assets` | Trang chờ, phát triển sau |
| 3.7 | Quản trị hệ thống | `/admin/users` | Có API cơ bản, UI là trang chờ |

**Trang chủ (`/`)** hiển thị mỗi phân hệ thành một thẻ (box) truy cập nhanh.

---

# 3. Yêu cầu chức năng chi tiết

## 3.1. Hồ sơ nhân sự (Personnel Profile Management)

### 3.1.1. Mục tiêu
HR có thể thêm mới, tra cứu nhanh và quản lý hồ sơ nhân viên, kèm theo các tài liệu pháp lý dạng PDF.

### 3.1.2. Yêu cầu chức năng

#### A. Thêm mới hồ sơ nhân sự
- **Quyền:** chỉ HR Admin / System Admin.
- **Các nhóm trường trên form:**
  - *Thông tin định danh:* Họ và tên, Giới tính, Ngày sinh, Số CCCD/CMND.
  - *Thông tin liên hệ:* Email công ty, Số điện thoại.
  - *Thông tin công việc:* Phòng ban, Chức vụ, Ngày vào làm.
  - *Tài liệu đính kèm:* có thể tải ngay file hợp đồng lao động PDF.
- **Mã nhân viên (`employee_code`) được hệ thống tự sinh, không cho nhập tay:**
  - **Công thức:** *tên* + *chữ cái đầu của họ và tên đệm*, bỏ dấu, viết thường. Ví dụ: Đặng Văn Long → `longdv`.
  - **Trùng mã:** nếu mã đã **từng được cấp** cho bất kỳ ai, kể cả nhân viên đã nghỉ hoặc đã bị xóa, thì thêm số tăng dần phía sau: `longdv1`, `longdv2`… Mọi mã đã cấp được lưu vĩnh viễn trong sổ đăng ký mã nên không bao giờ bị cấp lại.
  - **Xem trước:** form hiển thị rõ mã dự kiến, cập nhật ngay khi gõ họ tên.
  - **Chốt mã:** mã thật được chốt lúc bấm *Lưu*. Nếu có người khác vừa tạo trùng mã thì số đuôi tự tăng, không báo lỗi.
- **Kiểm tra hợp lệ:**
  - Hiện chỉ bắt buộc *Họ và tên*.
  - Kiểm tra trùng *Số CCCD*.
  - *Email công ty* phải là duy nhất.

#### B. Danh sách nhân sự
- **Desktop:** dạng bảng gồm các cột Ảnh đại diện (chữ viết tắt), Mã NV, Họ tên, Email, Số điện thoại, Phòng ban, Trạng thái, Tài liệu.
- **Mobile:** dạng thẻ rút gọn.
- **Phân trang:** chọn 10 / 20 / 50 bản ghi mỗi trang.
- **Sắp xếp:** theo họ tên hoặc ngày vào làm.
- **Giữ trạng thái khi quay lại:** từ khóa tìm kiếm, trang và cách sắp xếp được lưu trên URL, nên bấm *Back* vẫn giữ nguyên.
- **Trang chi tiết:** bấm tên nhân viên để mở trang `/personnel/:id`, xem và sửa đầy đủ thông tin. Chỉ HR/Admin được sửa; vai trò khác chỉ xem.

#### C. Tìm kiếm real-time đa trường
- **Cách lọc:** một ô tìm kiếm chung, tự lọc khi gõ (có debounce 300ms), không cần bấm nút.
- **Cách khớp:** không phân biệt hoa/thường, khớp một phần chuỗi.
- **Các trường được tìm:** Mã nhân viên, Họ và tên, Email công ty, Số CCCD.

#### D. Tài liệu đính kèm & Trình xem PDF
- **Nhiều tài liệu cho một nhân viên:** mỗi nhân viên có **nhiều tài liệu**, mỗi tài liệu thuộc một loại: *Hợp đồng lao động*, *Phụ lục hợp đồng*, *Tài liệu khác*.
- **Tải lên:** chỉ nhận PDF, tối đa 10MB. Mỗi lần tải lên là **thêm mới**, giữ nguyên tài liệu cũ, kể cả khi nhân viên đã có hợp đồng.
- **Xóa:** HR xóa từng tài liệu, có bước xác nhận ngay trên dòng. Xóa là xóa hẳn cả bản ghi lẫn file.
- **Trang chi tiết nhân viên:** phần "Hợp đồng & tài liệu (n)" liệt kê mọi tài liệu (mới nhất lên đầu) với tên file, loại và ngày tải lên. Bấm một tài liệu để mở popup xem PDF.
- **Danh sách nhân viên:** cột *Tài liệu* hiển thị "Xem tài liệu (n)".
  - Bấm vào mở popup **danh sách tài liệu**.
  - Bấm một tài liệu để xem PDF chi tiết.
  - **Đóng phần xem chi tiết sẽ quay lại danh sách tài liệu**, không đóng hẳn popup.
- **Popup xem PDF:** trình đọc PDF nhúng, có nút đóng (X, Esc, hoặc bấm ra ngoài) và nút *Tải xuống*.

### 3.1.3. Yêu cầu kỹ thuật giao diện
- Ô tìm kiếm dùng debounce để không giật lag khi danh sách lớn.
- Dùng lại các component chung (`Button`, `Modal`, `Pagination`, `Icon`) và thang màu `brand-*`.

## 3.2. Hợp đồng (Contract Management)
- **Loại hợp đồng:** thử việc, xác định thời hạn, không xác định thời hạn, thời vụ.
- **Thông tin lưu trữ:** số hợp đồng, ngày ký, ngày hiệu lực, ngày hết hạn, lương thỏa thuận, phụ lục.
- **Cảnh báo hết hạn:** thông báo HR trước khi hợp đồng hết hạn (ví dụ 30 / 60 ngày).

## 3.3. Phúc lợi (Benefits Management)
- **Danh mục gói phúc lợi:** BHYT, BHXH, bảo hiểm sức khỏe cao cấp, phụ cấp ăn trưa / gửi xe / điện thoại, khám sức khỏe định kỳ.
- **Phân bổ:** gán gói cho từng nhân viên hoặc nhóm nhân viên.
- **Lịch sử:** nhân viên tra cứu phúc lợi được hưởng và lịch sử sử dụng/thanh toán.

## 3.4. Chấm công & Nghỉ phép (Attendance & Leave Management)

### Tổng quan trang `/attendance`
- **Đầu trang:**
  - Nút chính **"Tạo ticket của bạn"**.
  - Link **"Xem quỹ ngày nghỉ của tôi"**, xem mục 3.4.2.
- **Các tab** (tab đang chọn được lưu trên URL):

| Tab | Ai thấy | Nội dung |
|---|---|---|
| Ticket của tôi | Mọi tài khoản có hồ sơ nhân viên | Chỉ các ticket do mình tạo |
| Chờ tôi xử lý | Cấp duyệt Trưởng phòng trở lên | Các ticket mà bước hiện tại đang chờ chính mình; số lượng hiển thị trên tab |
| Tất cả đơn | HR Admin / System Admin | Mọi ticket toàn công ty |
| Chấm công | Tất cả | Bản ghi giờ vào/ra; nhân viên chỉ thấy của mình, HR/Admin thấy toàn công ty |
| Quỹ ngày nghỉ | HR Admin / System Admin | Xem và cấu hình quỹ của từng nhân viên (mục 3.4.2) |

- **Ticket:** bấm một ticket để mở popup chi tiết, gồm thông tin đơn, **dòng thời gian các bước duyệt** (ai xử lý, lúc nào, ghi chú) và các nút thao tác theo quyền.

### Loại nghỉ
Nghỉ phép năm · Nghỉ ốm · Nghỉ bù · Thai sản · Nghỉ không lương · Khác (việc riêng). Có thể đăng ký theo ngày hoặc nửa ngày.

### Các yêu cầu khác của phân hệ (chưa triển khai)
- **Chấm công trực tuyến:** check-in/check-out trên web, có thể kiểm tra IP/GPS.
- **Ticket "Giải trình chấm công"** (quên check-in/out, đi muộn, về sớm, công tác).
- **Bảng tổng hợp công tháng:** ngày công thực tế, đi muộn, về sớm, OT, ngày nghỉ theo loại, làm căn cứ tính lương.

### 3.4.1. Workflow duyệt ticket nghỉ (Leave Approval Workflow)

**Luồng duyệt theo cấp duyệt của người tạo ticket:**

| Người tạo | Bước 1 | Bước 2 | Bước 3 |
|---|---|---|---|
| Nhân viên | Tạo ticket | Trưởng phòng **xác nhận** | Giám đốc **duyệt** |
| Trưởng phòng | Tạo ticket | Giám đốc **duyệt** | — |
| Giám đốc | Tạo ticket | CEO **duyệt** | — |
| CEO | Tạo ticket → **tự động duyệt** (không có cấp trên) | — | — |

```
Nhân viên tạo ticket ──► Trưởng phòng xác nhận ──► Giám đốc duyệt ──► ĐÃ DUYỆT
                              │ từ chối                 │ từ chối
                              ▼                         ▼
                           TỪ CHỐI                   TỪ CHỐI
```

**Chọn người duyệt khi tạo ticket:**
- **Bắt buộc chọn đủ:** form liệt kê các bước theo bảng trên. Người tạo **bắt buộc chọn người duyệt cho mọi bước**; nhân viên không được tự bỏ qua bước Trưởng phòng.
- **Ô tìm kiếm của mỗi bước chỉ trả về người giữ đúng cấp của bước đó.** Ví dụ với nhân viên, bước 2 chỉ ra các Trưởng phòng và bước 3 chỉ ra các Giám đốc. Tương tự cho Trưởng phòng và Giám đốc.
- **Tìm theo** họ tên hoặc tài khoản (mã NV / email công ty / email đăng nhập). Kết quả không gồm nhân viên đã nghỉ việc và không gồm chính người tạo.
- **Người duyệt mặc định:** mỗi bước được điền sẵn người đầu tiên giữ đúng cấp khi đi ngược chuỗi quản lý trực tiếp của người tạo. Người tạo có thể đổi sang người khác cùng cấp.
- **Kiểm tra phía backend:** backend kiểm tra lại cấp duyệt, số bước và trạng thái làm việc của từng người được chọn.

**Xử lý ticket:**
- **Thứ tự bước:** các bước được sinh sẵn lúc tạo ticket và xử lý **lần lượt**. Chỉ người duyệt của **bước hiện tại** mới thao tác được; không duyệt vượt bước.
- **Từ chối** ở bất kỳ bước nào → ticket chuyển *Từ chối*, các bước sau chuyển *Bỏ qua*.
- **Đồng ý ở bước cuối** → ticket chuyển *Đã duyệt*. Người duyệt có thể kèm ghi chú.
- **Hủy:** người tạo được hủy ticket khi ticket còn *Chờ duyệt*.

**Trạng thái ticket:** `Chờ duyệt` → `Đã duyệt` / `Từ chối` / `Đã hủy`.
**Trạng thái từng bước:** `Đang chờ` / `Đồng ý` / `Từ chối` / `Bỏ qua`.

### 3.4.2. Quỹ ngày nghỉ (Leave Balance)

Mỗi nhân viên có **quỹ ngày nghỉ riêng cho từng loại nghỉ, theo từng năm**. HR cấu hình quỹ cho từng nhân viên; nhân viên chưa được cấu hình thì dùng **quỹ mặc định** (tạm thời giống nhau cho mọi nhân viên):

| Loại nghỉ | Số ngày / năm |
|---|---|
| Nghỉ phép năm | 12 |
| Nghỉ ốm | 30 |
| Nghỉ bù | 5 |
| Thai sản | 130 (ngày làm việc, khoảng 6 tháng) |
| Nghỉ không lương | 30 |
| Khác (việc riêng) | 3 |

**Cách tính:**
- **Đếm ngày:** chỉ tính **ngày làm việc thứ 2 – thứ 6** (chưa trừ ngày lễ); nghỉ nửa ngày = 0,5. Ticket chỉ gồm thứ 7 / chủ nhật thì không hợp lệ. Ticket được tính vào năm của *ngày bắt đầu*.
- **Quỹ chỉ thực sự bị trừ khi ticket được duyệt xong mọi bước:**
  - **Đã dùng** = tổng ngày của các ticket *đã duyệt xong*.
  - **Còn lại trong quỹ** = Được cấp − Đã dùng.
- **Đang chờ duyệt** = tổng ngày của các ticket đang trong quá trình duyệt, kể cả khi trưởng phòng đã xác nhận nhưng giám đốc chưa duyệt. Phần này *chưa trừ* vào quỹ. Ticket bị từ chối hoặc đã hủy thì không còn được tính.
- **Có thể đăng ký thêm** = Còn lại trong quỹ − Đang chờ duyệt.
- **Không lưu số đã dùng:** hệ thống chỉ lưu số ngày *được cấp*; số đã dùng và đang chờ duyệt luôn được tính trực tiếp từ các ticket nên không bị lệch.

**Kiểm tra khi tạo ticket** (tính cả quỹ hiện có lẫn các ticket đang được xử lý):
- **Chỉ cho gửi** khi ticket có ít nhất 1 ngày làm việc và **số ngày ≤ "Có thể đăng ký thêm"** của loại nghỉ tương ứng. Backend kiểm tra lại khi nhận ticket.
- **Ví dụ:** quỹ "Khác" có 3 ngày và đang có 1 ticket 2 ngày chờ duyệt. Quỹ vẫn còn 3 ngày, nhưng chỉ đăng ký thêm được 1 ngày.
- **Form hiển thị:** còn lại / được cấp, số ngày đang chờ duyệt ở ticket khác, số có thể đăng ký thêm, và số ngày làm việc của ticket đang tạo. Khi vượt quỹ, dòng này chuyển đỏ và nút *Gửi* bị khóa.

**Giao diện:**
- **Mọi nhân viên:** popup *"Quỹ ngày nghỉ của tôi"* (chọn được năm) hiển thị từng loại nghỉ, gồm số còn lại / được cấp và thanh tiến độ (đã dùng; đang chờ duyệt).
- **HR / Admin:** tab *"Quỹ ngày nghỉ"* là bảng mọi nhân viên × loại nghỉ (còn lại / được cấp, kèm số chờ duyệt). Có tìm theo tên/mã và chọn năm. Bấm *Sửa* để cấu hình số ngày được cấp từng loại.

## 3.5. Master Data (Dữ liệu nền)
- **Quyền:** chỉ HR Admin / System Admin.
- **Phòng ban:** tên, mã (duy nhất). Không cho xóa khi còn nhân viên thuộc phòng ban đó.
- **Chức vụ:** tên chức vụ và **Cấp duyệt** (Nhân viên / Trưởng phòng / Giám đốc / CEO), dùng cho workflow ở mục 3.4.1. Không cho xóa khi còn nhân viên giữ chức vụ đó.

## 3.6. Quản lý tài sản (Asset Management) — *dự kiến*
- Theo dõi danh mục tài sản và thiết bị cấp phát cho từng nhân viên.
- Quản lý lịch sử bàn giao và thu hồi.
- Hiện đã có box ở trang chủ và trang chờ `/assets`, chưa đặc tả chi tiết.

## 3.7. Quản trị hệ thống (System Administration)
- Quản lý tài khoản đăng nhập: tạo, khóa, gán vai trò.
- Cấu hình chung và bảo mật truy cập.
- Mỗi tài khoản có thể liên kết với **một** hồ sơ nhân viên. Tài khoản hệ thống không liên kết (ví dụ `admin@hrm.local`) **không tạo được ticket nghỉ**.

---

# 4. Yêu cầu phi chức năng

## 4.1. Giao diện và khả năng đáp ứng
- **Thiết kế:** hiện đại, trực quan, dùng **thang màu thương hiệu `brand-*`** (gốc `#4FC9A9`, mint/ngọc lam) xuyên suốt; phân hệ mới không tự thêm màu khác.
- **Trình duyệt hỗ trợ:** Chrome, Safari, Firefox, Edge.
- **Responsive:** bảng trên desktop chuyển sang dạng thẻ trên mobile.

## 4.2. Hiệu năng và bảo mật
- **Hiệu năng:** SPA tải nhanh; API phản hồi dưới 2 giây cho thao tác thông thường.
- **Bảo mật:**
  - HTTPS khi triển khai thật.
  - Đăng nhập bằng JWT.
  - Phân quyền RBAC kiểm tra ở **từng endpoint** backend.
  - Mọi quy tắc nghiệp vụ (cấp duyệt, quỹ ngày nghỉ, quyền xem) đều được **backend kiểm tra lại**, không chỉ dựa vào giao diện.
- **Dữ liệu:**
  - Schema quản lý bằng migration (Alembic).
  - Cần cơ chế backup định kỳ.

---

# 5. Kế hoạch phát triển tiếp theo (Backlog)

| Phân hệ | Việc cần làm |
|---|---|
| 3.4 Chấm công | Check-in/out trên web; ticket "Giải trình chấm công" (hiện mới có UI); bảng tổng hợp công tháng; tính ngày lễ khi đếm ngày nghỉ; API check-in/out cần ràng buộc theo người đăng nhập (hiện nhận `employee_id` từ URL). |
| 3.4 Nghỉ phép | Đính kèm giấy tờ (giấy khám bệnh...); thông báo cho người duyệt; tách ticket bắc cầu qua 2 năm. |
| 3.2 Hợp đồng | UI quản lý hợp đồng, cảnh báo hết hạn. |
| 3.3 Phúc lợi | UI danh mục, gán gói, lịch sử sử dụng. |
| 3.6 Tài sản | Đặc tả và xây dựng phân hệ. |
| 3.7 Quản trị | UI quản lý tài khoản; liên kết tài khoản với hồ sơ nhân viên trên giao diện. |
| Triển khai | Xem mục 6.7. |

---

# 6. Phụ lục: Trạng thái triển khai hiện tại (Implementation Snapshot)

> Mục này mô tả **những gì đã thực sự được xây dựng** trong code, để khi đổi máy hoặc `git pull` về máy mới có thể dựng lại môi trường và biết chính xác dự án đang ở đâu. **Cập nhật lần cuối: 2026-10-27.** Nếu mục này lệch với code thực tế thì code là nguồn đúng; hãy sửa lại mục này cho khớp.

## 6.1. Tên sản phẩm & bộ nhận diện
- **Tên hiển thị:** **Zei OXA v1.0** (lịch sử đổi tên: "HRM Web App" → "Zei Group HR" → "Zei OXA v1.0").
- **Khẩu hiệu trang chủ:** "Vận hành doanh nghiệp tập trung, gọn nhẹ và trực quan".
- **Logo/favicon:** mark chữ "Z" trên nền brand — `apps/frontend/public/favicon.svg` và icon `logo` trong `src/components/ui/Icon.tsx`.
- **Màu chủ đạo:** `apps/frontend/tailwind.config.js` (`brand-50` → `brand-950`).

## 6.2. Cấu trúc code
- **Backend:** `apps/backend/app/modules/<domain>/` gồm `router.py` + `schemas.py` (+ `service.py`). Mẫu đầy đủ nhất: `personnel/`, `attendance/`.
- **Frontend:** `apps/frontend/src/features/<domain>/`, component chung ở `src/components/ui/`, gọi API ở `src/api/`, kiểu dữ liệu ở `src/types/`.
- **RBAC:**
  - `require_roles(...)` trong `app/common/deps.py`.
  - `get_current_employee` (cùng file) lấy hồ sơ nhân viên của tài khoản đăng nhập.
  - `/auth/me` trả kèm `employee` (`id`, `employee_code`, `full_name`, `approval_level`); frontend lấy qua hook `useMe()`.

## 6.3. Mức độ hoàn thiện từng phân hệ

### 3.1 Hồ sơ nhân sự — ĐÃ TRIỂN KHAI theo mục 3.1
- **Sinh mã nhân viên:** `employee_code_base()` và `generate_employee_code()` trong `app/modules/personnel/service.py`. Bảng `employee_code_registry` lưu mọi mã đã cấp (chỉ ghi thêm, không xóa).
- **Tài liệu:** bảng `employee_documents`.
  - Loại tài liệu: `employment_contract` / `contract_appendix` / `other`.
  - File lưu đĩa cục bộ `apps/backend/uploads/` (không có trong git).
- **API** (`/api/v1/personnel`):
  - `GET|POST /employees`, `GET|PUT /employees/{id}`, `GET /employees/code-preview?full_name=`
  - `POST /employees/{id}/documents?doc_type=`, `DELETE /employees/{id}/documents/{doc_id}`

### 3.4 Chấm công & Nghỉ phép
**Đã triển khai:** ticket nghỉ, workflow 3.4.1, quỹ ngày nghỉ 3.4.2.
- **Workflow:** `app/modules/attendance/service.py`.
  - `WORKFLOW_BY_LEVEL` định nghĩa luồng duyệt.
  - `build_steps()` sinh và kiểm tra các bước khi tạo ticket.
  - `decide()` / `cancel()` xử lý duyệt, từ chối, hủy.
  - Lưu trong bảng `leave_approval_steps`; cấp duyệt ở cột `positions.approval_level`.
- **Quỹ ngày nghỉ:** `app/modules/attendance/balance.py`.
  - `DEFAULT_QUOTAS` là quỹ mặc định; `count_leave_days()` đếm ngày làm việc và phải khớp hàm `countLeaveDays()` ở frontend.
  - Bảng `leave_balances` lưu số ngày được cấp theo nhân viên × năm × loại (unique).
- **API** (`/api/v1/attendance`):
  - **Ticket:** `GET /leave-requests?scope=mine|to_review|all`, `POST /leave-requests`, `POST /leave-requests/{id}/decision`, `POST /leave-requests/{id}/cancel`
  - **Chọn người duyệt:** `GET /leave-requests/workflow`, `GET /approvers?level=&search=`
  - **Quỹ ngày nghỉ:** `GET /leave-balances/me?year=`, `GET /leave-balances?year=` (HR), `PUT /leave-balances/{employee_id}?year=` (HR)
  - **Chấm công:** `GET /records?scope=mine|all`, `POST /check-in/{employee_id}`, `POST /check-out/{employee_id}` (chưa có UI)
- **Chưa làm:** xem mục 5.

### 3.5 Master Data — ĐÃ TRIỂN KHAI
- Route `/master-data`.
- API: `/personnel/departments`, `/personnel/positions` (CRUD; chức vụ có `approval_level`).

### 3.2 Hợp đồng, 3.3 Phúc lợi, 3.7 Quản trị
- Đã có model và API CRUD cơ bản (`/contracts`, `/benefits/plans`, `/benefits/assignments`, `/users`).
- Frontend còn là trang chờ (`PlaceholderPage`).

### 3.6 Quản lý tài sản
- Chỉ có box ở trang chủ và trang chờ `/assets`; chưa có backend.

### Migration Alembic
Theo thứ tự trong `apps/backend/alembic/versions/`:
1. `18df025ee786` — initial schema
2. `e36ad726a81a` — `employee_code_registry` (tự đăng ký các mã đã có)
3. `cd2ed3d3ef7b` — `leave_approval_steps` + `positions.approval_level`
4. `b8896a044899` — `leave_balances` theo loại nghỉ (thêm `leave_type` + unique, bỏ `used_days`)

## 6.4. Dữ liệu test & công cụ dev

**Seed dữ liệu test** (chỉ dùng ở dev; chạy lại nhiều lần vẫn an toàn — đã có dữ liệu thì tự bỏ qua):
```bash
docker compose exec backend python scripts/seed_test_data.py
```

| Nhóm | Số lượng | Tài khoản (`<mã>@zeigroup.test`, mật khẩu `Test@123`) |
|---|---|---|
| Nhân viên | 10 | IT: `huyhq1`, `lanvt`, `longdv`, `khoakv` · Kế toán: `sonmv`, `thaoct`, `tambt` · Kinh doanh: `namnv`, `oanhdt`, `longdv1` |
| Trưởng phòng | 3 | `ducpm` (IT), `quyentt` (Kế toán), `maidt` (Kinh doanh) |
| Giám đốc | 2 | `annv` (Kinh doanh → quản lý `maidt`), `hangvt` (Vận hành → quản lý `ducpm`, `quyentt`, HR) |
| CEO | 1 | `khaitm` |
| HR | 1 | `binhtt` (role `hr_admin`, cấp duyệt Nhân viên, báo cáo thẳng GĐ `hangvt`) |
| Admin | 1 | `admin@hrm.local` / `Admin@123` (tạo bởi `scripts/seed.py`) |

**Các dữ liệu khác trong seed:**
- 15 ticket nghỉ ở đủ trạng thái của workflow.
- Quỹ ngày nghỉ mặc định cho năm nay và năm sau.
- Hợp đồng, phúc lợi, chấm công 10 ngày làm việc gần nhất.
- **Mã `huyhq` được đánh dấu "đã từng cấp"** để test quy tắc không cấp lại mã, nên Hoàng Quốc Huy nhận mã `huyhq1`.

**Reset dữ liệu:** `docker compose down -v` → `docker compose up -d` → chạy lại lệnh seed.

**Nút "Dev · đổi tài khoản" ở chân trang (TẠM THỜI):**
- File: `src/components/layout/DevRoleSwitcher.tsx`. Chỉ hiện khi chạy dev.
- Dropdown liệt kê 18 tài khoản test theo nhóm; chọn tài khoản nào là đăng nhập ngay bằng tài khoản đó.
- Danh sách trong dropdown phải khớp với seed.
- **Xóa file này và dòng `<DevRoleSwitcher />` trong `PageShell.tsx` khi hoàn thiện app.**

## 6.5. Dựng lại môi trường trên máy mới (sau khi `git pull`)

```bash
# 1. Cài và bật Docker Desktop.
# 2. Tạo .env ở gốc repo (KHÔNG có trong git vì chứa secret):
cp .env.example .env
# Sinh secret MỚI, không dùng lại giá trị mẫu:
python -c "import secrets; print(secrets.token_urlsafe(48))"   # -> SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(24))"   # -> MYSQL_ROOT_PASSWORD
python -c "import secrets; print(secrets.token_urlsafe(24))"   # -> MYSQL_PASSWORD (sửa luôn DATABASE_URL cho khớp)

# 3. Nếu cổng 8000/5173/3306/8080 bị project khác chiếm: đổi BACKEND_PORT/FRONTEND_PORT/MYSQL_PORT
#    trong .env (sửa VITE_API_URL cho khớp BACKEND_PORT). Không dừng container của project khác.

# 4. Dựng stack (backend tự chạy `alembic upgrade head` + seed admin mặc định):
docker compose up -d --build

# 5. (Tùy chọn) Seed dữ liệu test - xem mục 6.4.

# 6. Kiểm tra:
#    Frontend http://localhost:5173 · API docs http://localhost:8000/docs · Adminer http://localhost:8080
```

Không chạy `Base.metadata.create_all()`. Toàn bộ schema được tạo bằng `alembic upgrade head` từ thư mục `alembic/versions/`.

## 6.6. Vấn đề đã gặp và cách xử lý (tránh debug lại)
- **`password cannot be longer than 72 bytes`:** do `passlib` 1.7.4 xung khắc với `bcrypt>=4.1`. Đã ghim `bcrypt==4.0.1` trong `requirements.txt`, không gỡ dòng ghim này.
- **`ImportError: email-validator is not installed`:** cần `email-validator==2.2.0` trong `requirements.txt`.
- **`failed to locate a name ('Employee')` khi chạy script độc lập:** script phải import `app.db.base` (nạp toàn bộ model) trước khi query.
- **Hot reload frontend không ăn khi chạy Docker trên Windows:** bind mount không phát sự kiện thay đổi file. Đã bật `server.watch.usePolling` trong `apps/frontend/vite.config.ts`.
- **Gõ tiếng Việt có dấu trong `curl` trên Git Bash (Windows) bị hỏng ký tự:** đây là lỗi encoding của terminal, không phải lỗi code. Khi test API có dữ liệu tiếng Việt, chạy script Python *bên trong* container backend.
- **Log `Can't connect to MySQL server on 'db'` ngay sau `docker compose up`:** backend khởi động trước khi MySQL sẵn sàng, sẽ tự thử lại. Bình thường, không cần xử lý.

## 6.7. Việc còn thiếu để deploy lên hosting thật
Chi tiết trong `DEPLOYMENT.md`. Tóm tắt:
- Chưa có object storage cho file upload (đang lưu đĩa cục bộ).
- Chưa tách "release command" (migration) khỏi "start command".
- Chưa đổi mật khẩu admin mặc định.
- Phải gỡ nút "Dev · đổi tài khoản" trước khi phát hành.
