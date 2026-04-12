from fastapi import APIRouter
from pydantic import BaseModel

from app.services.git_sync_service import git_sync_service

router = APIRouter(prefix="/sync", tags=["sync"])


# ── 请求模型 ──


class SyncConfigRequest(BaseModel):
    repo_url: str
    branch: str = "main"


# ── 配置管理 ──


@router.get("/config")
async def get_sync_config():
    """获取当前同步配置（仓库地址、分支）。"""
    cfg = git_sync_service.read_config()
    return cfg


@router.put("/config")
async def update_sync_config(body: SyncConfigRequest):
    """更新同步配置。"""
    cfg = git_sync_service.save_config(repo_url=body.repo_url, branch=body.branch)
    return {"ok": True, "config": cfg}


# ── Git 操作 ──


@router.post("/pull")
async def git_pull():
    """从远程仓库拉取数据。"""
    result = await git_sync_service.git_pull()
    return result


@router.post("/push")
async def git_push():
    """将本地数据推送到远程仓库。"""
    result = await git_sync_service.git_push()
    return result


@router.get("/status")
async def git_status():
    """获取 git 仓库状态。"""
    result = await git_sync_service.git_status()
    return result
