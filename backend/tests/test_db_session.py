import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.session import get_session
from app.config import get_settings

from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_get_session_returns_asyncsession():
    settings = get_settings()
    async for session in get_session(settings=settings):
        assert isinstance(session, AsyncSession)
        break

@pytest.mark.asyncio
async def test_get_session_rollback_on_exception():
    settings = get_settings()
    with patch("app.infra.db.session.async_sessionmaker") as mock_sessionmaker:
        mock_session = AsyncMock(spec=AsyncSession)
        mock_sessionmaker.return_value().__aenter__.return_value = mock_session
        # Simulate an exception inside the session context
        class TestException(Exception):
            pass

        with pytest.raises(TestException):
            async_gen = get_session(settings=settings)
            await async_gen.asend(None) 
            await async_gen.athrow(TestException("fail"))

        mock_session.rollback.assert_awaited()