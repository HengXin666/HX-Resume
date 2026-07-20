from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "HX-Resume API"
    DEBUG: bool = True
    APP_ENV: str = "development"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./hx_resume.db"

    # Single-user authentication. Production deployments must override all
    # three values; startup validation rejects these development defaults.
    AUTH_USERNAME: str = "admin"
    AUTH_PASSWORD: str = "hx-resume-dev-password"
    AUTH_PASSWORD_FILE: str | None = None
    SESSION_SECRET: str = "hx-resume-development-session-secret"
    SESSION_SECRET_FILE: str | None = None
    SESSION_MAX_AGE: int = 60 * 60 * 12
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_NAME: str = "hx_resume_session"
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW_SECONDS: int = 300

    # Common local dev origins. The regex covers auto-selected Vite ports.
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ORIGIN_REGEX: str = r"^http://(localhost|127\.0\.0\.1):[0-9]+$"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def load_secret_files(self) -> None:
        """Load Docker/Podman secret files without exposing values as container env vars."""
        if self.AUTH_PASSWORD_FILE:
            self.AUTH_PASSWORD = (
                Path(self.AUTH_PASSWORD_FILE).read_text(encoding="utf-8").rstrip("\r\n")
            )
        if self.SESSION_SECRET_FILE:
            self.SESSION_SECRET = Path(self.SESSION_SECRET_FILE).read_text(encoding="utf-8").rstrip(
                "\r\n"
            )

    def validate_security_settings(self) -> None:
        """Fail closed when a production deployment uses unsafe defaults."""
        self.load_secret_files()
        if self.APP_ENV.lower() != "production":
            return
        if not self.AUTH_USERNAME.strip():
            raise RuntimeError("AUTH_USERNAME must not be empty")
        if self.AUTH_PASSWORD in {
            "hx-resume-dev-password",
            "replace-with-a-long-password",
        } or len(self.AUTH_PASSWORD) < 12:
            raise RuntimeError("AUTH_PASSWORD must be changed and contain at least 12 characters")
        if (
            self.SESSION_SECRET
            in {
                "hx-resume-development-session-secret",
                "replace-with-at-least-32-random-characters",
            }
            or len(self.SESSION_SECRET) < 32
        ):
            raise RuntimeError("SESSION_SECRET must be random and contain at least 32 characters")


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# data/ is a local git repository used for syncing resume data.
DATA_DIR = BASE_DIR / "data"
