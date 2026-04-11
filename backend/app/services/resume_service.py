import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume
from app.schemas.resume import ResumeCreate, ResumeUpdate
from app.services.github_service import github_service


async def create_resume(db: AsyncSession, data: ResumeCreate) -> Resume:
    resume = Resume(
        id=str(uuid.uuid4()),
        title=data.title,
        slug=data.slug,
        template_id=data.template_id,
        basics=data.basics.model_dump() if data.basics else None,
        education=[e.model_dump() for e in data.education] if data.education else None,
        work=[w.model_dump() for w in data.work] if data.work else None,
        skills=[s.model_dump() for s in data.skills] if data.skills else None,
        projects=[p.model_dump() for p in data.projects] if data.projects else None,
        awards=data.awards,
        languages=data.languages,
        interests=data.interests,
        custom_sections=(
            [cs.model_dump() for cs in data.custom_sections] if data.custom_sections else None
        ),
        style_config=data.style_config.model_dump() if data.style_config else None,
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
    result = await db.execute(select(Resume).order_by(Resume.updated_at.desc()))
    return list(result.scalars().all())


async def update_resume(db: AsyncSession, resume_id: str, data: ResumeUpdate) -> Resume | None:
    resume = await get_resume(db, resume_id)
    if not resume:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Handle nested model dumps
    if "basics" in update_data and data.basics:
        update_data["basics"] = data.basics.model_dump()
    if "education" in update_data and data.education:
        update_data["education"] = [e.model_dump() for e in data.education]
    if "work" in update_data and data.work:
        update_data["work"] = [w.model_dump() for w in data.work]
    if "skills" in update_data and data.skills:
        update_data["skills"] = [s.model_dump() for s in data.skills]
    if "projects" in update_data and data.projects:
        update_data["projects"] = [p.model_dump() for p in data.projects]
    if "custom_sections" in update_data and data.custom_sections:
        update_data["custom_sections"] = [cs.model_dump() for cs in data.custom_sections]
    if "style_config" in update_data and data.style_config:
        update_data["style_config"] = data.style_config.model_dump()

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
            # Update existing
            for key, value in data.items():
                if hasattr(existing, key) and key not in ("id", "created_at"):
                    setattr(existing, key, value)
            existing.source = "github"
            existing.github_path = file_info["path"]
        else:
            # Create new
            resume = Resume(
                id=str(uuid.uuid4()),
                title=data.get("title", slug),
                slug=slug,
                template_id=data.get("template_id", "classic"),
                basics=data.get("basics"),
                education=data.get("education"),
                work=data.get("work"),
                skills=data.get("skills"),
                projects=data.get("projects"),
                awards=data.get("awards"),
                languages=data.get("languages"),
                interests=data.get("interests"),
                custom_sections=data.get("custom_sections"),
                style_config=data.get("style_config"),
                source="github",
                github_path=file_info["path"],
            )
            db.add(resume)

        synced.append({"slug": slug, "path": file_info["path"]})

    await db.commit()
    return synced
