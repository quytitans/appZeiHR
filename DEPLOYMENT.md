# Deployment — Zei Group HR

Ghi chú cấu hình để deploy lên hosting thật (không phải máy dev). Đọc file này TRƯỚC khi deploy lần đầu.

## 1. Danh sách biến môi trường

### Backend (`apps/backend`)

| Biến | Dev (local) | Production | Ghi chú |
| --- | --- | --- | --- |
| `DATABASE_URL` | `mysql+pymysql://hrm_user:...@db:3306/hrm_db` | connection string của MySQL managed (RDS, PlanetScale, Railway MySQL...) | Bắt buộc đổi. Không dùng container MySQL tự host cho production trừ khi tự quản lý backup/HA. |
| `SECRET_KEY` | sinh ngẫu nhiên, lưu trong `.env` (gitignored) | **secret khác**, lấy từ secret manager của hosting (Railway/Render/Fly Variables, AWS Secrets Manager...) | Không bao giờ dùng lại giá trị dev. Sinh bằng `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Đổi secret này sẽ vô hiệu hoá toàn bộ JWT đang phát hành. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 480 | tuỳ chính sách bảo mật (thường ngắn hơn, vd 60-120) | |
| `CORS_ORIGINS` | `http://localhost:5173` | domain thật của frontend, vd `https://hr.zeigroup.com` (nhiều domain cách nhau bởi dấu phẩy) | Sai giá trị này = frontend gọi API bị chặn CORS. |
| `UPLOAD_DIR` | `uploads` (đĩa cục bộ trong container) | **xem mục 3** | Đĩa container không bền vững trên hầu hết hosting (redeploy = mất file). |
| `MAX_UPLOAD_SIZE_MB` | 10 | tuỳ nhu cầu | |

### Frontend (`apps/frontend`)

| Biến | Dev (local) | Production | Ghi chú |
| --- | --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8001/api/v1` | `https://api.your-domain.com/api/v1` | **Bake tại build-time**, không phải runtime — xem mục 2. |

### MySQL (chỉ áp dụng nếu tự host DB bằng Docker, không dùng managed DB)

`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` — đổi hết sang giá trị mới nếu tự host, hoặc bỏ qua toàn bộ nếu dùng managed MySQL (khi đó chỉ cần `DATABASE_URL`).

## 2. Gotcha quan trọng nhất: Vite bake `VITE_API_URL` lúc build, không phải lúc chạy

Khác với backend (đọc `.env` mỗi lần container khởi động), `VITE_API_URL` được Vite nhúng thẳng vào file JS tại thời điểm `npm run build`. Đặt biến môi trường trên hosting **sau khi** đã build sẽ không có tác dụng gì.

- Dùng `apps/frontend/Dockerfile` (production, multi-stage + Nginx) và truyền đúng URL backend qua build-arg:
  ```bash
  docker build --build-arg VITE_API_URL=https://api.your-domain.com/api/v1 \
    -t zei-hr-frontend apps/frontend
  ```
- Nếu hosting build tự động từ Git (Vercel/Netlify/Render static site...), cấu hình `VITE_API_URL` trong phần **build environment variables** của platform đó, không phải "runtime env".
- Đổi domain backend sau này bắt buộc phải **build lại** frontend, không thể sửa bằng cách restart container.

## 3. Lưu trữ file upload (hợp đồng PDF)

Hiện tại backend lưu file PDF hợp đồng trực tiếp lên đĩa container (`UPLOAD_DIR`, mặc định `uploads/`), phục vụ qua `/files/...` (xem `app/main.py` mount `StaticFiles`). Điều này **chỉ phù hợp cho self-host 1 instance có volume bền vững** (đúng như `docker-compose.yml` local đang làm — mount `./apps/backend:/app`).

Khi deploy lên hosting kiểu container ephemeral (Railway/Render/Fly/K8s không có volume, hoặc scale nhiều instance):
- File sẽ **mất khi container restart/redeploy**, hoặc **không đồng bộ giữa các instance**.
- Cần thay bằng object storage (S3-compatible: AWS S3, Cloudflare R2, MinIO...) trước khi lên production thật. Đây là việc **chưa làm** trong scaffold này — điểm cần làm tiếp theo, không phải lỗi.
- Nếu hosting có volume bền vững gắn theo container (vd Railway Volumes, Fly Volumes), có thể tiếp tục dùng đĩa cục bộ bằng cách mount volume vào đúng `UPLOAD_DIR`.

## 4. Database schema: dùng Alembic migration, không dùng `create_all`

Schema được quản lý bằng Alembic (`apps/backend/alembic/versions/`). Quy trình deploy đúng:

1. Trước khi start server mới, chạy `alembic upgrade head` (một lần, không chạy song song nhiều instance cùng lúc để tránh migration lock conflict).
2. Nhiều hosting có khái niệm "release command"/"pre-deploy command" riêng biệt với "start command" — đặt `alembic upgrade head` vào đó, `uvicorn app.main:app` vào start command. Không nhét cả hai vào chung 1 lệnh như `docker-compose.yml` local đang làm (cách đó chỉ hợp lý khi chạy 1 instance duy nhất).
3. `scripts/seed.py` chỉ tạo 1 tài khoản System Admin mặc định (`admin@hrm.local` / `Admin@123`) — **bắt buộc đổi mật khẩu này ngay sau lần deploy production đầu tiên**, hoặc sửa `DEFAULT_ADMIN_EMAIL`/`DEFAULT_ADMIN_PASSWORD` trong script trước khi chạy seed trên production.
4. Khi thay đổi model (`apps/backend/app/models/`), luôn sinh migration mới bằng `alembic revision --autogenerate -m "..."` và review file sinh ra trước khi commit — không sửa schema production bằng tay.

## 5. Checklist trước khi deploy lần đầu

- [ ] `SECRET_KEY` production khác dev, lưu trong secret manager của hosting.
- [ ] `DATABASE_URL` trỏ tới MySQL managed (không phải container tạm).
- [ ] `CORS_ORIGINS` là domain frontend thật (https).
- [ ] Frontend build với đúng `VITE_API_URL` production (build-arg, không phải env runtime).
- [ ] Xác định giải pháp lưu file upload (object storage hoặc volume bền vững) trước khi có nhân sự thật upload hợp đồng.
- [ ] Chạy `alembic upgrade head` trước khi start server mới.
- [ ] Đổi mật khẩu admin mặc định ngay sau khi seed lần đầu trên production.
- [ ] Có cơ chế backup định kỳ cho MySQL (yêu cầu phi chức năng 4.2 trong SRS).
