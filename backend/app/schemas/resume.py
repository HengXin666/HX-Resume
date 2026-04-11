from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Sub-schemas ---

class BasicsSchema(BaseModel):
    name: str = ""
    label: str = ""
    email: str = ""
    phone: str = ""
    url: str = ""
    summary: str = ""
    location: dict[str, str] = Field(default_factory=dict)
    profiles: list[dict[str, str]] = Field(default_factory=list)
    avatar: str = ""


class EducationItem(BaseModel):
    institution: str = ""
    area: str = ""
    study_type: str = ""
    start_date: str = ""
    end_date: str = ""
    score: str = ""
    courses: list[str] = Field(default_factory=list)


class WorkItem(BaseModel):
    company: str = ""
    position: str = ""
    website: str = ""
    start_date: str = ""
    end_date: str = ""
    summary: str = ""
    highlights: list[str] = Field(default_factory=list)


class SkillItem(BaseModel):
    name: str = ""
    level: str = ""
    keywords: list[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: str = ""
    description: str = ""
    url: str = ""
    highlights: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    start_date: str = ""
    end_date: str = ""


class CustomSection(BaseModel):
    id: str = ""
    title: str = ""
    items: list[dict[str, Any]] = Field(default_factory=list)


class StyleConfig(BaseModel):
    font_family: str = "'Noto Sans SC', sans-serif"
    font_size: float = 14
    line_height: float = 1.6
    margin_top: float = 20
    margin_bottom: float = 20
    margin_left: float = 24
    margin_right: float = 24
    section_gap: float = 16
    primary_color: str = "#00f0ff"
    accent_color: str = "#ff2d6d"
    text_color: str = "#e0e0e0"
    background_color: str = "#0a0a0f"
    heading_size: float = 18
    page_size: str = "A4"


# --- API schemas ---

class ResumeCreate(BaseModel):
    title: str
    slug: str
    template_id: str = "classic"
    basics: BasicsSchema | None = None
    education: list[EducationItem] | None = None
    work: list[WorkItem] | None = None
    skills: list[SkillItem] | None = None
    projects: list[ProjectItem] | None = None
    awards: list[dict[str, Any]] | None = None
    languages: list[dict[str, str]] | None = None
    interests: list[dict[str, Any]] | None = None
    custom_sections: list[CustomSection] | None = None
    style_config: StyleConfig | None = None


class ResumeUpdate(BaseModel):
    title: str | None = None
    template_id: str | None = None
    basics: BasicsSchema | None = None
    education: list[EducationItem] | None = None
    work: list[WorkItem] | None = None
    skills: list[SkillItem] | None = None
    projects: list[ProjectItem] | None = None
    awards: list[dict[str, Any]] | None = None
    languages: list[dict[str, str]] | None = None
    interests: list[dict[str, Any]] | None = None
    custom_sections: list[CustomSection] | None = None
    style_config: StyleConfig | None = None


class ResumeResponse(BaseModel):
    id: str
    title: str
    slug: str
    template_id: str
    basics: dict[str, Any] | None
    education: list[dict[str, Any]] | None
    work: list[dict[str, Any]] | None
    skills: list[dict[str, Any]] | None
    projects: list[dict[str, Any]] | None
    awards: list[dict[str, Any]] | None
    languages: list[dict[str, str]] | None
    interests: list[dict[str, Any]] | None
    custom_sections: list[dict[str, Any]] | None
    style_config: dict[str, Any] | None
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    id: str
    title: str
    slug: str
    template_id: str
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
