# CLAUDE.md — Zei Group HR

Hướng dẫn cho Claude Code khi mở project này trên **bất kỳ máy nào** (kể cả sau khi `git clone`/`git pull` lần đầu trên máy mới). Đọc file này trước khi làm gì khác trong repo.

## Project là gì

**Zei Group HR** — web app quản lý nhân sự, đặc tả tại [`srs_quan_ly_nhan_su.md`](srs_quan_ly_nhan_su.md) (mục 6 của file đó là "trạng thái triển khai hiện tại", luôn đọc mục đó trước để biết chính xác phần nào đã code, phần nào còn placeholder).

Stack: Python FastAPI + SQLAlchemy 2.0 + Alembic (backend) · MySQL 8 · React + TypeScript + Vite + Tailwind + TanStack Query + Zustand (frontend) · Docker Compose cho dev. Monorepo: `apps/backend/`, `apps/frontend/`.

**Không đổi stack này khi chưa hỏi user** — đã chốt qua thảo luận trước đó, không phải để tùy nghi.

## Khôi phục môi trường dev trên máy mới (làm theo đúng thứ tự)

### 1. Kiểm tra Docker
```bash
docker --version && docker compose version
docker info   # nếu lỗi "cannot connect to daemon" -> Docker Desktop cài rồi nhưng chưa chạy, mở app Docker Desktop lên, đợi ~10-20s rồi thử lại docker info
```
Nếu `docker --version` báo không tìm thấy lệnh → Docker Desktop chưa cài trên máy này, cần cài trước (không tự ý cài mà không hỏi user nếu đây là máy lạ/không phải máy cá nhân của họ).

### 2. Tạo file `.env` gốc (KHÔNG có trong git — chứa secret)
```bash
cp .env.example .env
```
Sau đó sinh secret MỚI cho máy này, không copy secret từ máy khác/tài liệu cũ:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"   # -> SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(24))"   # -> MYSQL_ROOT_PASSWORD
python -c "import secrets; print(secrets.token_urlsafe(24))"   # -> MYSQL_PASSWORD (nhớ sửa DATABASE_URL cho khớp password mới)
```
Điền các giá trị này vào `.env`.

### 3. Kiểm tra xung đột cổng TRƯỚC khi `docker compose up`
Máy dev có thể đã chạy sẵn project Docker khác chiếm cổng 8000/5173/3306/8080. Kiểm tra:
```bash
docker ps -a --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```
Nếu cổng nào trong `BACKEND_PORT` (mặc định 8000), `FRONTEND_PORT` (5173), `MYSQL_PORT` (3306) bị chiếm bởi container **không thuộc project này**, đổi cổng trong `.env` (ví dụ đã từng gặp trên máy dev đầu tiên: cổng 8000 bị 1 project khác chiếm → phải đổi `BACKEND_PORT=8001` và sửa `VITE_API_URL=http://localhost:8001/api/v1` cho khớp). Không bao giờ dừng/xoá container của project khác để giải phóng cổng — luôn đổi cổng của project này thay vào đó.

### 4. Dựng stack
```bash
docker compose up -d --build
```
Lệnh `command` của service `backend` trong `docker-compose.yml` tự chạy `alembic upgrade head` (tạo schema từ migration có sẵn trong `apps/backend/alembic/versions/`) rồi `python scripts/seed.py` (tạo tài khoản admin mặc định nếu chưa có) trước khi start `uvicorn`.

### 5. Xác minh
```bash
docker compose ps                         # cả 4 service (db, adminer, backend, frontend) phải "Up"
curl http://localhost:8000/health         # (hoặc BACKEND_PORT đã đổi) -> {"status":"ok"}
```
Mở trình duyệt: frontend ở `http://localhost:5173` (hoặc `FRONTEND_PORT` đã đổi). Đăng nhập bằng tài khoản seed mặc định:
```
Email:    admin@hrm.local
Mật khẩu: Admin@123
```

## Lỗi đã từng gặp khi setup — đừng debug lại từ đầu, kiểm tra các fix này còn nguyên vẹn không

Nếu `docker compose up` build xong nhưng backend crash/loop, thứ tự nghi ngờ đầu tiên:

1. **`ValueError: password cannot be longer than 72 bytes`** khi hash password → `passlib` 1.7.4 xung khắc `bcrypt>=4.1`. Fix đã áp dụng: `apps/backend/requirements.txt` phải có dòng `bcrypt==4.0.1` ghim riêng (không dùng `passlib[bcrypt]` không ghim version). Nếu ai đó nâng cấp requirements.txt và xoá dòng ghim này, lỗi sẽ quay lại.
2. **`ImportError: email-validator is not installed`** → Pydantic `EmailStr` cần gói riêng. Fix: `email-validator==2.2.0` phải có trong `requirements.txt`.
3. **`sqlalchemy.exc.InvalidRequestError: ... failed to locate a name ('Employee')`** khi chạy `scripts/seed.py` riêng lẻ → script phải import `app.db.base` (nạp toàn bộ model registry) trước khi query, không chỉ import `app.models.user`. Đã fix trong `scripts/seed.py`, giữ nguyên comment giải thích ở đó.

Nếu 1 trong 3 lỗi trên xuất hiện lại, đó là do requirements.txt hoặc seed.py bị sửa lệch khỏi state đã fix — không phải bug môi trường mới, sửa lại đúng như 3 điểm trên.

## Chạy không dùng Docker (khi cần debug riêng backend/frontend)

Xem [README.md](README.md) mục "Chạy thủ công". Lưu ý: `apps/backend/uploads/` (file PDF hợp đồng đã upload) không nằm trong git, sẽ trống trên máy mới — bình thường, không phải lỗi.

## Quy ước code khi thêm tính năng mới

- Backend: 1 phân hệ = 1 thư mục `app/modules/<domain>/` gồm `router.py` + `schemas.py` (+ `service.py` nếu có logic đáng tách riêng — xem `app/modules/personnel/` làm mẫu đầy đủ nhất). RBAC qua `require_roles(...)` trong `app/common/deps.py`, khớp 4 vai trò ở SRS mục 2.1.
- Frontend: 1 phân hệ = 1 thư mục `src/features/<domain>/`, tái dùng component chung ở `src/components/ui/` (Button, Modal, Pagination, Icon...) thay vì viết lại. Xem `src/features/personnel/` làm mẫu tham chiếu (responsive table/card, debounced search, form modal, PDF viewer).
- Màu sắc: chỉ dùng thang màu `brand-*` định nghĩa ở `apps/frontend/tailwind.config.js` (gốc `#4FC9A9`, mint/ngọc lam) — đây là màu thương hiệu xuyên suốt, không tự thêm màu khác cho các phân hệ mới.
- Khi đổi model backend (`app/models/`), luôn sinh migration mới: `alembic revision --autogenerate -m "..."`, review file sinh ra trước khi commit. Không dùng `Base.metadata.create_all()`.

## Khi cần chi tiết hơn

- [README.md](README.md) — chạy dự án, kiến trúc backend/frontend tóm tắt.
- [DEPLOYMENT.md](DEPLOYMENT.md) — deploy lên hosting thật (biến môi trường production, object storage cho file upload, tách release/start command).
- [srs_quan_ly_nhan_su.md](srs_quan_ly_nhan_su.md) mục 6 — snapshot chi tiết nhất về hiện trạng code, cập nhật mỗi khi có thay đổi lớn.
