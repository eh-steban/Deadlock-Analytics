import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel, select
from app.domain.user import User
from app.repo.users_repo import UserRepository
from app.infra.db.models import UserTable
from app.config import Settings, get_settings
from app.main import app

client = TestClient(app)

def get_settings_override():
    return Settings(environment="test")

app.dependency_overrides[get_settings] = get_settings_override

@pytest_asyncio.fixture
async def async_session():
    settings = get_settings_override()
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        yield session
    await engine.dispose()

@pytest.fixture
def repo():
    return UserRepository()

@pytest.mark.asyncio
async def test_create_user_success(repo, async_session):
    user = User(id=None, email="test@example.com")
    created = await repo.create_user(user, async_session)
    assert isinstance(created, User)
    assert created.id
    assert created.email == "test@example.com"
    result = await async_session.execute(
        select(UserTable).where(UserTable.email == "test@example.com")
    )
    db_user = result.scalar_one_or_none()
    assert db_user

@pytest.mark.asyncio
async def test_create_user_fail_duplicate(repo, async_session):
    user = User(id=None, email="test@example.com")
    await repo.create_user(user, async_session)
    with pytest.raises(Exception):
        await repo.create_user(user, async_session)

@pytest.mark.asyncio
async def test_get_user_by_id_success(repo, async_session):
    user = User(id=None, email="test2@example.com")
    created = await repo.create_user(user, async_session)
    found = await repo.get_user_by_id(created.id, async_session)
    assert isinstance(found, User)
    assert found.id == created.id
    assert found.email == created.email

@pytest.mark.asyncio
async def test_get_user_by_id_not_found(repo, async_session):
    found = await repo.get_user_by_id(9999, async_session)
    assert found is None

# Generated ChatGPT code:
# tests/test_user_repo.py
# import pytest
# from app.repo.users_repo import UserRepository
# from app.domain.user import User  # or however your models are structured

# @pytest.mark.asyncio
# async def test_create_and_get_user(async_session):
#     repo = UserRepository(session=async_session)

#     # Create
#     user = await repo.create_user(steam_id="STEAM_12345", email="test@example.com")
#     assert user.user_id is not None

#     # Fetch
#     fetched = await repo.get_user_by_id(user.user_id)
#     assert fetched is not None
#     assert fetched.steam_id == "STEAM_12345"
