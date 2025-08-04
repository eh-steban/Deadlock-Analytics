import logging
import textwrap
from httpx import AsyncClient, Response, Timeout
from app.config import get_settings
from app.domain.deadlock_api import MatchMetadata, MatchSummary

settings = get_settings()
logger = logging.getLogger(__name__)
class DeadlockAPIClient:
    def __init__(self):
        self.api_key = settings.DEADLOCK_API_KEY
        self.timeout = Timeout(300.0, connect=30.0)
        self.client = AsyncClient(timeout=self.timeout)

    async def call_api(self, url: str) -> Response:
        headers = {"X-API-Key": self.api_key}
        response = await self.client.get(url, headers=headers)
        if response.is_error:
            truncated_text = textwrap.shorten(response.text, width=200, placeholder='...')
            logger.error(f"DeadlockAPIClient#call_api({url}) failed: {response.status_code} - {truncated_text}")
            raise Exception(f"#call_api({url}) Failed: HTTP {response.status_code} - {truncated_text}")
        return response

    async def fetch_account_match_history(self, steam_id: str) -> list[MatchSummary]:
        url = self.api_url(f"/v1/players/{steam_id}/match-history")
        response = await self.call_api(url)
        return response.json()

    async def fetch_match_metadata(self, match_id: int) -> MatchMetadata:
        url = self.api_url(f"/v1/matches/{match_id}/metadata")
        response = await self.call_api(url)
        return MatchMetadata(**response.json())

    async def fetch_salts(self, match_id: int) -> dict[str, str]:
        url = self.api_url(f"/v1/matches/{match_id}/salts")
        response = await self.call_api(url)
        return response.json()

    @staticmethod
    def api_url(path: str) -> str:
        return f"{settings.DEADLOCK_API_DOMAIN}{path}"

