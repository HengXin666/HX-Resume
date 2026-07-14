from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "HX-Resume API"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./hx_resume.db"

    # Common local dev origins. The regex covers auto-selected Vite ports.
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ORIGIN_REGEX: str = r"^http://(localhost|127\.0\.0\.1):[0-9]+$"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# data/ is a local git repository used for syncing resume data.
DATA_DIR = BASE_DIR / "data"
