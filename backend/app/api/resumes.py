from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.resume import (
    ResumeCreate,
    ResumeListItem,
    ResumeResponse,
    ResumeUpdate,
)
from app.services import resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("/", response_model=list[ResumeListItem])
async def list_resumes(db: AsyncSession = Depends(get_db)):
    return await resume_service.list_resumes(db)


@router.post("/", response_model=ResumeResponse, status_code=201)
async def create_resume(data: ResumeCreate, db: AsyncSession = Depends(get_db)):
    existing = await resume_service.get_resume_by_slug(db, data.slug)
    if existing:
        raise HTTPException(status_code=409, detail=f"Slug '{data.slug}' already exists")
    return await resume_service.create_resume(db, data)


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    resume = await resume_service.get_resume(db, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("/slug/{slug}", response_model=ResumeResponse)
async def get_resume_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    resume = await resume_service.get_resume_by_slug(db, slug)
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


@router.post("/sync-github")
async def sync_from_github(db: AsyncSession = Depends(get_db)):
    synced = await resume_service.sync_from_github(db)
    return {"synced": synced, "count": len(synced)}


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
        "skills": resume.skills,
        "projects": resume.projects,
        "awards": resume.awards,
        "languages": resume.languages,
        "interests": resume.interests,
        "custom_sections": resume.custom_sections,
        "style_config": resume.style_config,
    }


@router.post("/import-json")
async def import_resume_json(data: ResumeCreate, db: AsyncSession = Depends(get_db)):
    existing = await resume_service.get_resume_by_slug(db, data.slug)
    if existing:
        # Update existing resume
        update_data = ResumeUpdate(**data.model_dump(exclude={"slug"}))
        resume = await resume_service.update_resume(db, existing.id, update_data)
        return {"action": "updated", "resume": resume}
    else:
        resume = await resume_service.create_resume(db, data)
        return {"action": "created", "resume": resume}
