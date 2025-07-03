import httpx
import aiofiles
import os
from app.config import settings
from typing import Any

class DeadlockAPIClient:
    def __init__(self):
        self.api_key = settings.API_KEY
        self.replay_file_path = settings.REPLAY_FILE_PATH
        self.timeout = httpx.Timeout(300.0, connect=30.0)
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def get(self, url: str, caller: str) -> dict[str, Any] | list[Any]:
        headers = {"X-API-Key": self.api_key}
        response = await self.client.get(url, headers=headers)
        if response.is_error:
            raise Exception(f"Failed #{caller}: HTTP {response.status_code} - {response.text}")
        return response.json()

    async def get_new_stream(self, url: str, caller: str):
        headers = {"X-API-Key": self.api_key}
        response = await self.client.get(url, headers=headers)
        if response.is_error:
            raise Exception(f"Failed #{caller}: HTTP {response.status_code} - {response.text}")
        return response.aiter_bytes()

    async def download_from_stream(self, replay_file_stream, match_id: int) -> str:
        output_file_path = os.path.join(self.replay_file_path, f"{match_id}.dem.bz2")
        async with aiofiles.open(output_file_path, 'wb') as out_file:
            async for chunk in replay_file_stream:
                await out_file.write(chunk)
        return output_file_path

    async def close(self):
        await self.client.aclose()
