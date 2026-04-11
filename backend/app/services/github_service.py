import base64
import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


class GitHubService:
    """Service for fetching resume data from a private GitHub repository."""

    def __init__(self) -> None:
        self.token = settings.GITHUB_TOKEN
        self.repo = settings.GITHUB_REPO
        self.branch = settings.GITHUB_BRANCH

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    @property
    def is_configured(self) -> bool:
        return bool(self.token and self.repo)

    async def fetch_file(self, path: str) -> dict[str, Any] | None:
        """Fetch a single file from the private repo."""
        if not self.is_configured:
            logger.warning("GitHub not configured, skipping fetch")
            return None

        url = f"{GITHUB_API_BASE}/repos/{self.repo}/contents/{path}"
        params = {"ref": self.branch}

        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._headers, params=params)
            if resp.status_code != 200:
                logger.error("GitHub API error %d: %s", resp.status_code, resp.text)
                return None

            data = resp.json()
            content_b64 = data.get("content", "")
            content = base64.b64decode(content_b64).decode("utf-8")
            return json.loads(content)

    async def list_resumes(self) -> list[dict[str, Any]]:
        """List all resume JSON files in the repo's resumes/ directory."""
        if not self.is_configured:
            return []

        url = f"{GITHUB_API_BASE}/repos/{self.repo}/contents/resumes"
        params = {"ref": self.branch}

        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._headers, params=params)
            if resp.status_code != 200:
                return []

            files = resp.json()
            return [
                {"name": f["name"], "path": f["path"], "sha": f["sha"]}
                for f in files
                if f["name"].endswith(".json")
            ]

    async def save_file(self, path: str, content: dict[str, Any], message: str) -> bool:
        """Create or update a file in the private repo."""
        if not self.is_configured:
            return False

        url = f"{GITHUB_API_BASE}/repos/{self.repo}/contents/{path}"
        content_str = json.dumps(content, ensure_ascii=False, indent=2)
        content_b64 = base64.b64encode(content_str.encode("utf-8")).decode("ascii")

        # Check if file exists to get sha
        sha = None
        async with httpx.AsyncClient() as client:
            check = await client.get(
                url, headers=self._headers, params={"ref": self.branch}
            )
            if check.status_code == 200:
                sha = check.json().get("sha")

            payload: dict[str, Any] = {
                "message": message,
                "content": content_b64,
                "branch": self.branch,
            }
            if sha:
                payload["sha"] = sha

            resp = await client.put(url, headers=self._headers, json=payload)
            return resp.status_code in (200, 201)


github_service = GitHubService()
