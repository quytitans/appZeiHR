from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình ứng dụng, đọc từ biến môi trường / file .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "Zei Group HR API"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "mysql+pymysql://hrm_user:hrm_password@localhost:3306/hrm_db"

    SECRET_KEY: str = "change-me-to-a-random-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    CORS_ORIGINS: str = "http://localhost:5173"

    # Ngưỡng ngày cảnh báo hợp đồng sắp hết hạn (SRS 3.2)
    CONTRACT_EXPIRY_WARNING_DAYS: list[int] = [30, 60]

    # Upload tài liệu đính kèm (SRS 3.1.2.A) - lưu đĩa cục bộ cho môi trường tự host.
    # Khi deploy lên hosting có nhiều instance / ổ đĩa không bền vững, thay bằng object
    # storage (S3-compatible) - xem DEPLOYMENT.md.
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
