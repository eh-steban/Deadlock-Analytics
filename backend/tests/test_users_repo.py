import pytest

# from sqlmodel import select
from app.repo.users_repo import UserRepository
from tests.test_helper import setup_database, async_session
from psycopg.errors import UniqueViolation

steam_id = "12345678901234567"

@pytest.fixture
def repo():
    return UserRepository()

@pytest.mark.asyncio
async def test_create_user_success(repo, async_session):
    created = await repo.create_user(steam_id, async_session)
    assert created is not None
    assert hasattr(created, "id")
    assert hasattr(created, "steam_id")
    assert created.steam_id == steam_id

@pytest.mark.asyncio
async def test_create_user_fail_duplicate_steam_id(repo, async_session):
    await repo.create_user(steam_id, async_session)
    with pytest.raises(UniqueViolation, match=r'Steam ID'):
        await repo.create_user(steam_id, async_session)

@pytest.mark.asyncio
async def test_get_user_by_id_success(repo, async_session):
    created = await repo.create_user(steam_id, async_session)
    found = await repo.get_user_by_id(created.id, async_session)
    assert found is not None
    assert found.id == created.id
    assert found.steam_id == created.steam_id

@pytest.mark.asyncio
async def test_get_user_by_id_not_found(repo, async_session):
    found = await repo.get_user_by_id(9999, async_session)
    assert found is None

@pytest.mark.asyncio
async def test_get_user_by_steam_id_success(repo, async_session):
    created = await repo.create_user(steam_id, async_session)
    found = await repo.get_user_by_steam_id(created.steam_id, async_session)
    assert found is not None
    assert found.id == created.id
    assert found.steam_id == created.steam_id

@pytest.mark.asyncio
async def test_get_user_by_steam_id_not_found(repo, async_session):
    found = await repo.get_user_by_steam_id("00000000000000000", async_session)
    assert found is None