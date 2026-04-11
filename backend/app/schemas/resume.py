from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Sub-schemas (aligned with frontend types/resume.ts) ---


class SocialProfile(BaseModel):
    network: str = ""
    username: str = ""
    url: str = ""


class BasicsSchema(BaseModel):
    name: str = ""
    label: str = ""
    email: str = ""
    phone: str = ""
    url: str = ""
    summary: str = ""
    location: dict[str, str] = Field(default_factory=dict)
    profiles: list[SocialProfile] = Field(default_factory=list)
    avatar: str = ""


class EducationItem(BaseModel):
    institution: str = ""
    area: str = ""
    study_type: str = ""
    start_date: str = ""
    end_date: str = ""
    score: str = ""
    courses: list[str] = Field(default_factory=list)
    description: str = ""


class WorkItem(BaseModel):
    company: str = ""
    department: str = ""
    position: str = ""
    website: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""
    logo: str = ""


class ProjectItem(BaseModel):
    name: str = ""
    description: str = ""
    url: str = ""
    highlights: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    start_date: str = ""
    end_date: str = ""


class AwardItem(BaseModel):
    title: str = ""
    date: str = ""
    awarder: str = ""
    summary: str = ""


class LanguageItem(BaseModel):
    language: str = ""
    fluency: str = ""


class InterestItem(BaseModel):
    name: str = ""
    keywords: list[str] = Field(default_factory=list)


class CustomSectionItem(BaseModel):
    title: str = ""
    subtitle: str = ""
    date: str = ""
    description: str = ""
    highlights: list[str] = Field(default_factory=list)


class CustomSection(BaseModel):
    id: str = ""
    title: str = ""
    items: list[CustomSectionItem] = Field(default_factory=list)


class HeadingStyle(BaseModel):
    font_family: str = ""
    font_size: float = 18
    color: str = ""
    left_bar: bool = False
    left_bar_color: str = ""
    underline: str = "solid"
    underline_color: str = ""
    background: str = ""


class StyleConfig(BaseModel):
    font_family: str = "'Noto Sans SC', 'Inter', sans-serif"
    font_size: float = 14
    line_height: float = 1.6
    margin_top: float = 20
    margin_bottom: float = 20
    margin_left: float = 24
    margin_right: float = 24
    section_gap: float = 16
    primary_color: str = "#00f0ff"
    text_color: str = "#1a1a1a"
    background_color: str = "#ffffff"
    heading_size: float = 18
    page_size: str = "A4"
    custom_css: str = ""
    heading_style: HeadingStyle = Field(default_factory=HeadingStyle)
    logo_border: bool = True
    logo_border_radius: float = 6


class SectionVisibility(BaseModel):
    summary: bool = True
    work: bool = True
    education: bool = True
    skills: bool = True
    projects: bool = True
    awards: bool = False
    languages: bool = False
    interests: bool = False


# --- API schemas ---


class ResumeCreate(BaseModel):
    title: str
    slug: str
    template_id: str = "classic"
    basics: BasicsSchema | None = None
    education: list[EducationItem] | None = None
    work: list[WorkItem] | None = None
    skills_text: str = ""
    projects: list[ProjectItem] | None = None
    awards: list[AwardItem] | None = None
    languages: list[LanguageItem] | None = None
    interests: list[InterestItem] | None = None
    custom_sections: list[CustomSection] | None = None
    style_config: StyleConfig | None = None
    section_visibility: SectionVisibility | None = None
    section_order: list[str] | None = None
    sort_order: int = 0


class ResumeUpdate(BaseModel):
    title: str | None = None
    template_id: str | None = None
    basics: BasicsSchema | None = None
    education: list[EducationItem] | None = None
    work: list[WorkItem] | None = None
    skills_text: str | None = None
    projects: list[ProjectItem] | None = None
    awards: list[AwardItem] | None = None
    languages: list[LanguageItem] | None = None
    interests: list[InterestItem] | None = None
    custom_sections: list[CustomSection] | None = None
    style_config: StyleConfig | None = None
    section_visibility: SectionVisibility | None = None
    section_order: list[str] | None = None
    sort_order: int | None = None


class ResumeResponse(BaseModel):
    id: str
    title: str
    slug: str
    template_id: str
    basics: dict[str, Any] | None
    education: list[dict[str, Any]] | None
    work: list[dict[str, Any]] | None
    skills_text: str
    projects: list[dict[str, Any]] | None
    awards: list[dict[str, Any]] | None
    languages: list[dict[str, Any]] | None
    interests: list[dict[str, Any]] | None
    custom_sections: list[dict[str, Any]] | None
    style_config: dict[str, Any] | None
    section_visibility: dict[str, Any] | None
    section_order: list[str] | None
    sort_order: int
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    id: str
    title: str
    slug: str
    template_id: str
    sort_order: int
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
