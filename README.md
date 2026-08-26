# Zei Group HR

Web App Quản lý Nhân sự **Zei Group HR**, xây theo `srs_quan_ly_nhan_su.md` (đọc mục 6 "Phụ lục: Trạng thái triển khai hiện tại" trong file đó để biết chính xác hiện trạng code).

## Trạng thái hiện tại

- **Hồ sơ nhân sự (`/personnel`)**: triển khai đầy đủ Giai đoạn 1 — thêm mới hồ sơ (form với duplicate-check mã NV/CCCD), danh sách responsive (bảng desktop / thẻ mobile), tìm kiếm real-time đa trường có debounce, phân trang & sắp xếp, upload + xem PDF hợp đồng lao động qua modal ngay trên trình duyệt.
- **Hợp đồng, Phúc lợi, Chấm công & Nghỉ phép**: đã có model dữ liệu + API CRUD cơ bản, frontend còn là trang placeholder (`/contracts`, `/benefits`, `/attendance`) — triển khai chi tiết ở các lần sau.
- **Auth/RBAC**: JWT + 4 vai trò hoạt động đầy đủ, khớp bảng phân quyền SRS mục 2.1.
- **Database**: MySQL, schema quản lý bằng Alembic migration (không dùng `create_all`).
- **Màu chủ đạo (brand color)**: thang màu mint/ngọc lam dùng xuyên suốt UI — xem [Bảng màu thương hiệu](#bảng-màu-thương-hiệu-brand-color) bên dưới.
- **Deploy hosting**: xem [`DEPLOYMENT.md`](DEPLOYMENT.md) — chưa xong (còn thiếu object storage cho file upload, tách release/start command...).

## Công nghệ

| Layer | Công nghệ |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + Zustand |
| Backend | Python FastAPI + SQLAlchemy 2.0 + Alembic |
| Database | MySQL 8 |
| Hạ tầng dev | Docker Compose (MySQL + Adminer + backend + frontend) |

## Cấu trúc thư mục

```
apps/
  backend/    # FastAPI (xem apps/backend/app)
  frontend/   # React + Vite (xem apps/frontend/src)
docker-compose.yml
DEPLOYMENT.md       # cấu hình & lưu ý khi deploy lên hosting
.env.example
```

## Chạy bằng Docker Compose (khuyến nghị)

```bash
cp .env.example .env
# Sinh SECRET_KEY và mật khẩu MySQL mới thay vì dùng giá trị mẫu, xem srs_quan_ly_nhan_su.md mục 6.4.
docker compose up -d --build
```

Backend tự chạy `alembic upgrade head` rồi seed tài khoản System Admin mặc định khi khởi động:

```
Email:    admin@hrm.local
Mật khẩu: Admin@123   (đổi ngay nếu đây không phải môi trường demo)
```

Mặc định các cổng là `FRONTEND_PORT=5173`, `BACKEND_PORT=8000`, `MYSQL_PORT=3306` — nếu máy bạn đã có project khác chiếm cổng này, đổi trong `.env` (nhớ sửa `VITE_API_URL` cho khớp `BACKEND_PORT` mới).

- Frontend: http://localhost:5173
- Backend Swagger UI: http://localhost:8000/docs (hoặc cổng đã đổi)
- Adminer (xem DB): http://localhost:8080 (server: `db`, user/pass theo `.env`)

## Chạy thủ công (không dùng Docker)

### Backend

```bash
cd apps/backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # rồi sửa DATABASE_URL trỏ tới MySQL đang chạy
alembic upgrade head          # tạo schema từ migration
python scripts/seed.py        # seed admin mặc định
uvicorn app.main:app --reload
```

### Frontend

```bash
cd apps/frontend
npm install
copy .env.example .env
npm run dev
```

Mở http://localhost:5173.

## Bảng màu thương hiệu (brand color)

Định nghĩa tại [`apps/frontend/tailwind.config.js`](apps/frontend/tailwind.config.js) dưới tên `brand` (alias `primary`), trích từ mẫu màu xanh mint/ngọc lam được cung cấp (gốc `#4FC9A9`). Đây là màu chủ đạo duy nhất cho toàn bộ hệ thống — mọi màn hình mới nên tái sử dụng thang màu này (`brand-50` → `brand-950`) thay vì tự chọn màu khác, để giữ UI/UX nhất quán xuyên suốt.

| Token | Hex | Dùng cho |
| --- | --- | --- |
| `brand-50` / `brand-100` | `#EFFAF7` / `#DCF4EE` | Nền nhạt, badge |
| `brand-500` | `#4FC9A9` | Màu gốc tham chiếu |
| `brand-600` | `#36B08F` | Nút CTA chính, icon nổi bật |
| `brand-700` | `#2C9076` | Hover/active state, text nhấn |
| `brand-900` / `brand-950` | `#1D5E4C` / `#123B30` | Text đậm trên nền sáng |

Logo/favicon là mark chữ **"Z"** (Zei Group HR) trên nền `brand-600`, định nghĩa tại [`apps/frontend/public/favicon.svg`](apps/frontend/public/favicon.svg) (dùng cho tab trình duyệt) và icon `logo` trong [`Icon.tsx`](apps/frontend/src/components/ui/Icon.tsx) (dùng trong Header/Login) — cả hai dùng chung 1 path để đồng nhất.

## Kiến trúc backend (tóm tắt)

- `app/core`: cấu hình (`config.py`), bảo mật/JWT (`security.py`).
- `app/common/deps.py`: `get_current_user`, `require_roles(...)` — RBAC dependency dùng cho mọi router, khớp 4 vai trò trong SRS mục 2.1 (`employee`, `line_manager`, `hr_admin`, `system_admin`).
- `app/common/storage.py`: lưu file PDF upload lên đĩa cục bộ (`UPLOAD_DIR`), validate định dạng/dung lượng — phục vụ qua `/files/...` (xem `app/main.py`).
- `app/models`: SQLAlchemy models chia theo domain (`user`, `personnel`, `contract`, `benefit`, `attendance`).
- `app/modules/<domain>`: mỗi phân hệ gồm `router.py` + `schemas.py` + `service.py` (personnel là mẫu tham chiếu đầy đủ nhất: search/pagination/duplicate-check/upload).
- `alembic/versions/`: migration quản lý schema — khi đổi model, chạy `alembic revision --autogenerate -m "..."` và review trước khi commit, không sửa DB production bằng tay.

## Kiến trúc frontend (tóm tắt)

- `src/api/`: axios client (`client.ts`, tự đính JWT) + hàm gọi API theo domain (`personnel.ts`).
- `src/components/ui/`: component dùng chung (Button, Modal, Pagination, Icon...) — mọi màn hình mới nên tái dùng thay vì viết lại.
- `src/features/<domain>/`: 1 phân hệ = 1 thư mục, gồm trang chính + `components/` con. Xem `src/features/personnel/` làm mẫu tham chiếu đầy đủ (table + card responsive, debounced search, form modal, PDF viewer modal).
- `src/hooks/useDebouncedValue.ts`: debounce dùng cho ô tìm kiếm real-time.
- `src/store/authStore.ts`: Zustand + persist localStorage cho auth state.

## Bước tiếp theo

1. Triển khai chi tiết UI cho Hợp đồng, Phúc lợi, Chấm công & Nghỉ phép (thay placeholder), theo đúng pattern của `features/personnel`.
2. Bổ sung test pytest cho các module còn lại (hiện personnel có thể test qua API thật, chưa có test tự động).
3. Cụ thể hóa luồng phê duyệt (Line Manager duyệt đơn nghỉ phép) và cảnh báo hết hạn hợp đồng tự động (job nền).
4. Chuẩn bị object storage cho file upload trước khi deploy hosting thật — xem `DEPLOYMENT.md` mục 3.
