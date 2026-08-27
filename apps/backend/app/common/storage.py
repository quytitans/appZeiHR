import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {"application/pdf"}


def save_pdf_upload(file: UploadFile, subdir: str) -> tuple[str, str]:
    """Lưu file PDF lên đĩa cục bộ, trả về (file_name gốc, url tương đối để phục vụ qua /files).

    Giới hạn định dạng PDF và dung lượng theo `settings.MAX_UPLOAD_SIZE_MB` (SRS 3.1.2.A).
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Chỉ chấp nhận file PDF cho hợp đồng lao động",
        )

    upload_root = Path(settings.UPLOAD_DIR) / subdir
    upload_root.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}.pdf"
    destination = upload_root / stored_name

    size = 0
    with destination.open("wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > settings.max_upload_size_bytes:
                buffer.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File vượt quá dung lượng tối đa {settings.MAX_UPLOAD_SIZE_MB}MB",
                )
            buffer.write(chunk)

    original_name = file.filename or stored_name
    file_url = f"/files/{subdir}/{stored_name}"
    return original_name, file_url


def delete_stored_file(file_url: str) -> None:
    """Xóa file đã lưu qua save_pdf_upload, dùng khi "thay thế" tài liệu cũ."""
    relative_path = file_url.removeprefix("/files/")
    path = Path(settings.UPLOAD_DIR) / relative_path
    path.unlink(missing_ok=True)
