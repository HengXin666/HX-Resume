import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    template_id: Mapped[str] = mapped_column(String(50), default="classic")

    # Core resume data stored as JSON
    basics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    education: Mapped[list | None] = mapped_column(JSON, nullable=True)
    work: Mapped[list | None] = mapped_column(JSON, nullable=True)
    skills_text: Mapped[str] = mapped_column(Text, default="")
    projects: Mapped[list | None] = mapped_column(JSON, nullable=True)
    awards: Mapped[list | None] = mapped_column(JSON, nullable=True)
    languages: Mapped[list | None] = mapped_column(JSON, nullable=True)
    interests: Mapped[list | None] = mapped_column(JSON, nullable=True)
    custom_sections: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Style & layout settings
    style_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    section_visibility: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    section_order: Mapped[list | None] = mapped_column(JSON, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Public resume (redaction) config
    public_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Metadata
    source: Mapped[str] = mapped_column(String(20), default="local")  # local / github
    github_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )
