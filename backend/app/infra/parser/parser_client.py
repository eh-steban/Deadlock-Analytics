import time
import httpx
from app.config import get_settings
from app.domain.exceptions import ParserServiceError
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class CircuitBreaker:
    """Simple circuit breaker for parser service."""

    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time: float | None = None
        self.state = "closed"  # closed, open, half_open

    async def call(self, func):
        """Execute async function with circuit breaker protection."""
        if self.state == "open":
            if self.last_failure_time and time.time() - self.last_failure_time < self.timeout:
                logger.warning("Circuit breaker is OPEN - parser service unavailable")
                raise ParserServiceError("Circuit breaker open: parser service temporarily unavailable")
            else:
                logger.info("Circuit breaker entering HALF_OPEN state")
                self.state = "half_open"

        try:
            result = await func()
            if self.state == "half_open":
                logger.info("Circuit breaker successful call in HALF_OPEN - resetting to CLOSED")
                self.state = "closed"
                self.failures = 0
            return result
        except ParserServiceError as e:
            self.failures += 1
            self.last_failure_time = time.time()

            if self.failures >= self.failure_threshold:
                logger.error(f"Circuit breaker threshold reached ({self.failures} failures) - opening circuit")
                self.state = "open"

            raise


class ParserClient:
    """HTTP client for parser service communication."""

    def __init__(self):
        self.base_url = settings.PARSER_BASE_URL
        self.timeout = httpx.Timeout(300.0, connect=30.0)
        self.client = httpx.AsyncClient(timeout=self.timeout)
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, timeout=60)

    async def check_demo_available(self, match_id: int) -> tuple[bool, str | None]:
        """
        Check if a demo file exists locally in the parser service.

        Args:
            match_id: The match ID to check

        Returns:
            (available, filename) where filename is None if not available

        Raises:
            ParserServiceError: If parser service is unreachable or returns error
        """
        async def _check():
            url = f"{self.base_url}/check-demo/{match_id}"
            try:
                logger.info("Checking parser for local demo: match_id=%s", match_id)
                response = await self.client.get(url)
                response.raise_for_status()
                data = response.json()
                available = data.get("available", False)
                filename = data.get("filename")

                if available:
                    logger.info("Parser has local demo for match_id=%s: %s", match_id, filename)
                else:
                    logger.info("Parser has no local demo for match_id=%s", match_id)

                return available, filename

            except httpx.TimeoutException as e:
                logger.error("Parser timeout checking demo for match_id=%s: %s", match_id, e)
                raise ParserServiceError(f"Parser service timeout: {e}")
            except httpx.HTTPStatusError as e:
                logger.error("Parser error checking demo for match_id=%s: %s - %s",
                            match_id, e.response.status_code, e.response.text[:200])
                raise ParserServiceError(f"Parser returned {e.response.status_code}")
            except httpx.ConnectError as e:
                logger.error("Parser connection failed for match_id=%s: %s", match_id, e)
                raise ParserServiceError(f"Failed to connect to parser service: {e}")
            except Exception as e:
                logger.error("Unexpected error checking parser for match_id=%s: %s", match_id, e)
                raise ParserServiceError(f"Failed to check parser: {e}")

        return await self.circuit_breaker.call(_check)

    async def parse_demo(self, demo_url: str) -> dict:
        """
        Parse a demo file via the parser service.

        Args:
            demo_url: Base64-encoded demo URL or local path

        Returns:
            Parsed match data as dict

        Raises:
            ParserServiceError: If parsing fails
        """
        async def _parse():
            url = f"{self.base_url}/parse"
            payload = {"demo_url": demo_url}

            try:
                logger.info("Calling parser service")
                response = await self.client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                return response.json()

            except httpx.TimeoutException as e:
                logger.error("Parser timeout: %s", e)
                raise ParserServiceError(f"Parser service timeout: {e}")
            except httpx.HTTPStatusError as e:
                logger.error("Parser error: %s - %s", e.response.status_code, e.response.text[:200])
                raise ParserServiceError(f"Parser returned {e.response.status_code}: {e.response.text[:200]}")
            except httpx.ConnectError as e:
                logger.error("Parser connection failed: %s", e)
                raise ParserServiceError(f"Failed to connect to parser service: {e}")
            except Exception as e:
                logger.error("Unexpected parser error: %s", e)
                raise ParserServiceError(f"Failed to parse: {e}")

        return await self.circuit_breaker.call(_parse)
