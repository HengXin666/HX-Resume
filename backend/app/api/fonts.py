import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import BASE_DIR
from app.core.database import get_db
from app.models.font import Font

router = APIRouter(prefix="/fonts", tags=["fonts"])

FONTS_DIR = BASE_DIR / "uploads" / "fonts"
ALLOWED_MIME = {
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    "application/x-font-ttf",
    "application/x-font-otf",
    "application/font-woff",
    "application/font-woff2",
    "application/octet-stream",
}
ALLOWED_EXT = {".ttf", ".otf", ".woff", ".woff2"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

MIME_MAP = {
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}


@router.post("/upload")
async def upload_font(
    file: UploadFile,
    family: str = "",
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(400, "缺少文件名")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"不支持的字体格式，仅支持: {', '.join(ALLOWED_EXT)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"文件过大，最大 {MAX_FILE_SIZE // 1024 // 1024}MB")

    font_id = str(uuid.uuid4())
    safe_filename = f"{font_id}{ext}"
    font_family = family or os.path.splitext(file.filename)[0]
    mime_type = MIME_MAP.get(ext, "application/octet-stream")

    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    font_path = FONTS_DIR / safe_filename
    font_path.write_bytes(content)

    font = Font(
        id=font_id,
        name=file.filename,
        family=font_family,
        filename=safe_filename,
        mime_type=mime_type,
        file_size=len(content),
    )
    db.add(font)
    await db.commit()
    await db.refresh(font)

    return {
        "id": font.id,
        "name": font.name,
        "family": font.family,
        "mime_type": font.mime_type,
        "file_size": font.file_size,
    }


@router.get("/")
async def list_fonts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Font).order_by(Font.created_at.desc()))
    fonts = result.scalars().all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "family": f.family,
            "mime_type": f.mime_type,
            "file_size": f.file_size,
        }
        for f in fonts
    ]


@router.get("/{font_id}/file")
async def get_font_file(font_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Font).where(Font.id == font_id))
    font = result.scalar_one_or_none()
    if not font:
        raise HTTPException(404, "字体不存在")

    font_path = FONTS_DIR / font.filename
    if not font_path.exists():
        raise HTTPException(404, "字体文件丢失")

    return FileResponse(
        font_path,
        media_type=font.mime_type,
        filename=font.name,
        headers={"Cache-Control": "public, max-age=31536000"},
    )


@router.delete("/{font_id}", status_code=204)
async def delete_font(font_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Font).where(Font.id == font_id))
    font = result.scalar_one_or_none()
    if not font:
        raise HTTPException(404, "字体不存在")

    font_path = FONTS_DIR / font.filename
    if font_path.exists():
        font_path.unlink()

    await db.delete(font)
    await db.commit()
