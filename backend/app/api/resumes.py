from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.resume import Resume
from app.schemas.resume import (
    ResumeCreate,
    ResumeListItem,
    ResumeResponse,
    ResumeUpdate,
)
from app.services import resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


# ── Bulk sync (must be before /{resume_id} to avoid path conflict) ──


class SyncItem(BaseModel):
    """One resume item in a sync batch. id is required (frontend-generated UUID)."""
    id: str
    data: ResumeCreate


class SyncRequest(BaseModel):
    resumes: list[SyncItem]
    active_resume_id: str | None = None


@router.put("/sync")
async def sync_resumes(body: SyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Full bi-directional sync: the frontend sends its entire resume list.
    - Resumes present in the request are upserted.
    - Resumes in the DB but NOT in the request are deleted (frontend is source of truth).
    """
    incoming_ids = {item.id for item in body.resumes}

    # Delete resumes not in the incoming set (local source only)
    result = await db.execute(select(Resume).where(Resume.source == "local"))
    existing = list(result.scalars().all())
    for r in existing:
        if r.id not in incoming_ids:
            await db.delete(r)

    # Upsert all incoming resumes
    upserted = []
    for item in body.resumes:
        resume = await resume_service.upsert_resume(db, item.id, item.data)
        upserted.append(resume.id)

    return {"synced": len(upserted), "ids": upserted}


@router.post("/sync-github")
async def sync_from_github(db: AsyncSession = Depends(get_db)):
    synced = await resume_service.sync_from_github(db)
    return {"synced": synced, "count": len(synced)}


# ── Standard CRUD ──


@router.get("/", response_model=list[ResumeListItem])
async def list_resumes(db: AsyncSession = Depends(get_db)):
    return await resume_service.list_resumes(db)


@router.get("/full", response_model=list[ResumeResponse])
async def list_resumes_full(db: AsyncSession = Depends(get_db)):
    """Return all resumes with complete data (for initial frontend hydration)."""
    return await resume_service.list_resumes(db)


@router.post("/", response_model=ResumeResponse, status_code=201)
async def create_resume(data: ResumeCreate, db: AsyncSession = Depends(get_db)):
    existing = await resume_service.get_resume_by_slug(db, data.slug)
    if existing:
        raise HTTPException(status_code=409, detail=f"Slug '{data.slug}' already exists")
    return await resume_service.create_resume(db, data)


@router.get("/slug/{slug}", response_model=ResumeResponse)
async def get_resume_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    resume = await resume_service.get_resume_by_slug(db, slug)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    resume = await resume_service.get_resume(db, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.patch("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str, data: ResumeUpdate, db: AsyncSession = Depends(get_db)
):
    resume = await resume_service.update_resume(db, resume_id, data)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await resume_service.delete_resume(db, resume_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume not found")


@router.post("/{resume_id}/export-json")
async def export_resume_json(resume_id: str, db: AsyncSession = Depends(get_db)):
    resume = await resume_service.get_resume(db, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "title": resume.title,
        "slug": resume.slug,
        "template_id": resume.template_id,
        "basics": resume.basics,
        "education": resume.education,
        "work": resume.work,
        "skills_text": resume.skills_text,
        "projects": resume.projects,
        "awards": resume.awards,
        "languages": resume.languages,
        "interests": resume.interests,
        "custom_sections": resume.custom_sections,
        "style_config": resume.style_config,
        "section_visibility": resume.section_visibility,
        "section_order": resume.section_order,
        "public_config": resume.public_config,
    }


@router.post("/import-json")
async def import_resume_json(data: ResumeCreate, db: AsyncSession = Depends(get_db)):
    existing = await resume_service.get_resume_by_slug(db, data.slug)
    if existing:
        update_data = ResumeUpdate(**data.model_dump(exclude={"slug"}))
        resume = await resume_service.update_resume(db, existing.id, update_data)
        return {"action": "updated", "resume": resume}
    else:
        resume = await resume_service.create_resume(db, data)
        return {"action": "created", "resume": resume}
