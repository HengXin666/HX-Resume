import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume
from app.schemas.resume import ResumeCreate, ResumeUpdate
from app.services.github_service import github_service


def _dump_field(val: Any) -> Any:
    """Call .model_dump() on Pydantic models, pass through plain values."""
    if val is None:
        return None
    if hasattr(val, "model_dump"):
        return val.model_dump()
    if isinstance(val, list) and val and hasattr(val[0], "model_dump"):
        return [v.model_dump() for v in val]
    return val


async def create_resume(db: AsyncSession, data: ResumeCreate) -> Resume:
    resume = Resume(
        id=str(uuid.uuid4()),
        title=data.title,
        slug=data.slug,
        template_id=data.template_id,
        basics=_dump_field(data.basics),
        education=_dump_field(data.education),
        work=_dump_field(data.work),
        skills_text=data.skills_text,
        projects=_dump_field(data.projects),
        awards=_dump_field(data.awards),
        languages=_dump_field(data.languages),
        interests=_dump_field(data.interests),
        custom_sections=_dump_field(data.custom_sections),
        style_config=_dump_field(data.style_config),
        section_visibility=_dump_field(data.section_visibility),
        section_order=data.section_order,
        sort_order=data.sort_order,
        public_config=_dump_field(data.public_config),
        source="local",
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


async def get_resume(db: AsyncSession, resume_id: str) -> Resume | None:
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    return result.scalar_one_or_none()


async def get_resume_by_slug(db: AsyncSession, slug: str) -> Resume | None:
    result = await db.execute(select(Resume).where(Resume.slug == slug))
    return result.scalar_one_or_none()


async def list_resumes(db: AsyncSession) -> list[Resume]:
    result = await db.execute(select(Resume).order_by(Resume.sort_order, Resume.updated_at.desc()))
    return list(result.scalars().all())


async def update_resume(db: AsyncSession, resume_id: str, data: ResumeUpdate) -> Resume | None:
    resume = await get_resume(db, resume_id)
    if not resume:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Dump nested Pydantic models to dicts
    for key in (
        "basics", "education", "work", "projects", "awards",
        "languages", "interests", "custom_sections", "style_config",
        "section_visibility", "public_config",
    ):
        if key in update_data:
            raw = getattr(data, key)
            update_data[key] = _dump_field(raw)

    for key, value in update_data.items():
        setattr(resume, key, value)

    await db.commit()
    await db.refresh(resume)
    return resume


async def delete_resume(db: AsyncSession, resume_id: str) -> bool:
    resume = await get_resume(db, resume_id)
    if not resume:
        return False
    await db.delete(resume)
    await db.commit()
    return True


async def upsert_resume(db: AsyncSession, resume_id: str, data: ResumeCreate) -> Resume:
    """Create or fully replace a resume by its id."""
    existing = await get_resume(db, resume_id)
    if existing:
        # Full replace
        existing.title = data.title
        existing.slug = data.slug
        existing.template_id = data.template_id
        existing.basics = _dump_field(data.basics)
        existing.education = _dump_field(data.education)
        existing.work = _dump_field(data.work)
        existing.skills_text = data.skills_text
        existing.projects = _dump_field(data.projects)
        existing.awards = _dump_field(data.awards)
        existing.languages = _dump_field(data.languages)
        existing.interests = _dump_field(data.interests)
        existing.custom_sections = _dump_field(data.custom_sections)
        existing.style_config = _dump_field(data.style_config)
        existing.section_visibility = _dump_field(data.section_visibility)
        existing.section_order = data.section_order
        existing.sort_order = data.sort_order
        existing.public_config = _dump_field(data.public_config)
        existing.source = "local"
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        resume = Resume(
            id=resume_id,
            title=data.title,
            slug=data.slug,
            template_id=data.template_id,
            basics=_dump_field(data.basics),
            education=_dump_field(data.education),
            work=_dump_field(data.work),
            skills_text=data.skills_text,
            projects=_dump_field(data.projects),
            awards=_dump_field(data.awards),
            languages=_dump_field(data.languages),
            interests=_dump_field(data.interests),
            custom_sections=_dump_field(data.custom_sections),
            style_config=_dump_field(data.style_config),
            section_visibility=_dump_field(data.section_visibility),
            section_order=data.section_order,
            sort_order=data.sort_order,
            public_config=_dump_field(data.public_config),
            source="local",
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
        return resume


async def sync_from_github(db: AsyncSession) -> list[dict[str, Any]]:
    """Sync resume data from GitHub private repo into SQLite."""
    remote_files = await github_service.list_resumes()
    synced = []

    for file_info in remote_files:
        data = await github_service.fetch_file(file_info["path"])
        if not data:
            continue

        slug = file_info["name"].replace(".json", "")
        existing = await get_resume_by_slug(db, slug)

        if existing:
            for key, value in data.items():
                if hasattr(existing, key) and key not in ("id", "created_at"):
                    setattr(existing, key, value)
            existing.source = "github"
            existing.github_path = file_info["path"]
        else:
            resume = Resume(
                id=str(uuid.uuid4()),
                title=data.get("title", slug),
                slug=slug,
                template_id=data.get("template_id", "classic"),
                basics=data.get("basics"),
                education=data.get("education"),
                work=data.get("work"),
                skills_text=data.get("skills_text", ""),
                projects=data.get("projects"),
                awards=data.get("awards"),
                languages=data.get("languages"),
                interests=data.get("interests"),
                custom_sections=data.get("custom_sections"),
                style_config=data.get("style_config"),
                section_visibility=data.get("section_visibility"),
                section_order=data.get("section_order"),
                sort_order=data.get("sort_order", 0),
                source="github",
                github_path=file_info["path"],
            )
            db.add(resume)

        synced.append({"slug": slug, "path": file_info["path"]})

    await db.commit()
    return synced
