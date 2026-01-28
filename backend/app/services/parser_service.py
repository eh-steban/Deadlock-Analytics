from app.infra.parser.parser_client import ParserClient
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ParserService:
    """Service for orchestrating parser operations."""

    def __init__(self):
        self.client = ParserClient()

    async def check_demo_available(self, match_id: int) -> tuple[bool, str | None]:
        """Check if parser has a local demo file for the match."""
        return await self.client.check_demo_available(match_id)

    async def parse_demo(self, demo_url: str) -> dict:
        """Parse a demo from a URL (base64 encoded)."""
        return await self.client.parse_demo(demo_url)
