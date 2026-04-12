import asyncio
import json
import logging
import shutil
import subprocess
from pathlib import Path
from typing import Any

from app.core.config import BASE_DIR, DATA_DIR

logger = logging.getLogger(__name__)

CONFIG_FILE = "sync_config.json"
DB_FILENAME = "hx_resume.db"


class GitSyncService:
    """使用本地 git 命令将 hx_resume.db 同步到私有远程仓库。

    - sync_config.json 存放在 backend/ 项目目录中，随本项目 git 提交。
    - data/ 目录是独立的 git 仓库，仅用于与远程同步 db 文件。
    """

    @property
    def data_dir(self) -> Path:
        return DATA_DIR

    @property
    def config_path(self) -> Path:
        """sync_config.json 存放在 backend/ 根目录。"""
        return BASE_DIR / CONFIG_FILE

    @property
    def local_db_path(self) -> Path:
        """本地正在使用的 SQLite 数据库。"""
        return BASE_DIR / DB_FILENAME

    @property
    def synced_db_path(self) -> Path:
        """data/ 目录中用于远程同步的 db 副本。"""
        return self.data_dir / DB_FILENAME

    # ── 配置管理 ──

    def read_config(self) -> dict[str, str]:
        """读取同步配置（仓库地址、分支等）。"""
        if not self.config_path.exists():
            return {"repo_url": "", "branch": "main"}
        raw = self.config_path.read_text(encoding="utf-8")
        return json.loads(raw)

    def save_config(self, repo_url: str, branch: str = "main") -> dict[str, str]:
        """保存同步配置到项目目录。"""
        cfg = {"repo_url": repo_url, "branch": branch}
        self.config_path.write_text(
            json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return cfg

    @property
    def is_configured(self) -> bool:
        cfg = self.read_config()
        return bool(cfg.get("repo_url"))

    # ── Git 命令执行 ──

    def _run_git_sync(self, *args: str) -> tuple[int, str, str]:
        """同步执行 git 命令（在线程池中调用）。"""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(
            ["git", *args],
            cwd=str(self.data_dir),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        return (
            result.returncode,
            result.stdout.strip(),
            result.stderr.strip(),
        )

    async def _run_git(self, *args: str) -> tuple[int, str, str]:
        """在 data 目录下执行 git 命令，返回 (returncode, stdout, stderr)。
        使用 to_thread 以兼容 Windows 上 uvicorn 的 SelectorEventLoop。
        """
        return await asyncio.to_thread(self._run_git_sync, *args)

    async def _ensure_git_repo(self) -> None:
        """确保 data/ 目录已初始化为 git 仓库，并正确设置 remote。"""
        cfg = self.read_config()
        repo_url = cfg.get("repo_url", "")
        branch = cfg.get("branch", "main")

        git_dir = self.data_dir / ".git"
        if not git_dir.exists():
            await self._run_git("init", "-b", branch)
            logger.info("Initialized git repo in %s", self.data_dir)

        if repo_url:
            code, current_url, _ = await self._run_git("remote", "get-url", "origin")
            if code != 0:
                await self._run_git("remote", "add", "origin", repo_url)
            elif current_url != repo_url:
                await self._run_git("remote", "set-url", "origin", repo_url)

    # ── db 文件搬运 ──

    def _copy_db_to_data(self) -> bool:
        """将本地 db 复制到 data/ 目录准备推送。"""
        if not self.local_db_path.exists():
            logger.warning("本地数据库 %s 不存在，跳过复制", self.local_db_path)
            return False
        self.data_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(self.local_db_path), str(self.synced_db_path))
        logger.info("已复制 db → data/: %s", self.synced_db_path)
        return True

    def _copy_db_from_data(self) -> bool:
        """将 data/ 目录中的 db 复制回本地工作位置。"""
        if not self.synced_db_path.exists():
            logger.warning("远程同步 db %s 不存在，跳过复制", self.synced_db_path)
            return False
        shutil.copy2(str(self.synced_db_path), str(self.local_db_path))
        logger.info("已复制 data/ → db: %s", self.local_db_path)
        return True

    # ── 核心操作 ──

    async def git_pull(self) -> dict[str, Any]:
        """从远程仓库拉取最新数据，并将 db 复制回本地。"""
        if not self.is_configured:
            return {"ok": False, "error": "未配置远程仓库地址"}

        await self._ensure_git_repo()
        cfg = self.read_config()
        branch = cfg.get("branch", "main")

        code, out, err = await self._run_git("pull", "origin", branch, "--rebase")
        if code != 0:
            code2, out2, err2 = await self._run_git("fetch", "origin")
            if code2 == 0:
                return {"ok": True, "message": "Fetch 成功（远程分支可能尚未创建）", "detail": out2 or err2}
            return {"ok": False, "error": err or err2, "detail": out}

        # 拉取成功后，将 data/ 中的 db 复制回 backend/
        restored = await asyncio.to_thread(self._copy_db_from_data)
        msg = out or "已是最新"
        if restored:
            msg += "（数据库已同步到本地）"

        return {"ok": True, "message": msg}

    async def git_push(self) -> dict[str, Any]:
        """将本地 db 复制到 data/ 并推送到远程仓库。"""
        if not self.is_configured:
            return {"ok": False, "error": "未配置远程仓库地址"}

        await self._ensure_git_repo()
        cfg = self.read_config()
        branch = cfg.get("branch", "main")

        # 先把 db 复制到 data/ 目录
        copied = await asyncio.to_thread(self._copy_db_to_data)
        if not copied:
            return {"ok": False, "error": "本地数据库不存在，无法推送"}

        # Stage all changes
        await self._run_git("add", "-A")

        # Commit
        code, out, err = await self._run_git(
            "commit", "-m", "sync: update resume data"
        )
        if code != 0 and "nothing to commit" not in (out + err):
            return {"ok": False, "error": f"Commit 失败: {err}", "detail": out}

        # Push
        code, out, err = await self._run_git("push", "-u", "origin", branch)
        if code != 0:
            return {"ok": False, "error": err, "detail": out}

        return {"ok": True, "message": out or "推送成功"}

    async def git_status(self) -> dict[str, Any]:
        """获取当前仓库状态。"""
        git_dir = self.data_dir / ".git"
        if not git_dir.exists():
            return {"initialized": False, "configured": self.is_configured}

        code, out, _ = await self._run_git("status", "--porcelain")
        has_changes = bool(out)

        _, branch_out, _ = await self._run_git("branch", "--show-current")

        return {
            "initialized": True,
            "configured": self.is_configured,
            "branch": branch_out,
            "has_uncommitted_changes": has_changes,
            "changes": out if has_changes else None,
        }


git_sync_service = GitSyncService()
