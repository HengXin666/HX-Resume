from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "HX-Resume API"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./hx_resume.db"

    # GitHub private repo
    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = ""  # e.g. "username/private-resume-data"
    GITHUB_BRANCH: str = "main"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
