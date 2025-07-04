from typing import Any
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient
from app.config import settings
import aiofiles
import json

class DeadlockAPIService:
    def __init__(self, api_client: DeadlockAPIClient):
        self.api_client = api_client

    async def fetch_account_match_history(self, account_id: int) -> list[dict[str, Any]]:
        url = self.api_url(f"/v1/players/{account_id}/match-history")
        return await self.api_client.get(url)

    async def fetch_match_metadata(self, match_id: int) -> dict[str, Any]:
        url = self.api_url(f"/v1/matches/{match_id}/metadata")
        return await self.api_client.get(url)

    async def fetch_demo_url(self, match_id: int) -> dict[str, str]:
        url = self.api_url(f"/v1/matches/{match_id}/demo-url")
        return await self.api_client.get(url)

    async def fetch_and_download_replay(self, demo_url: str, match_id: int) -> str:
        print(f"Starting download from {demo_url}")
        replay_file_stream = await self.api_client.get_new_stream(demo_url)
        output_file_path = await self.api_client.download_from_stream(replay_file_stream, match_id)
        print(f"Download complete: {output_file_path}")
        return output_file_path

    @staticmethod
    def api_url(path: str) -> str:
        return f"{settings.DEADLOCK_API_DOMAIN}{path}"
