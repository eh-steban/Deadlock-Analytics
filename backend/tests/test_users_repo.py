import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.domain.user import User
from app.repo.users_repo import UserRepository
from app.infra.db.models import UserTable

DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def async_session():
    engine = create_async_engine(DATABASE_URL, echo=True, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
    await engine.dispose()

@pytest.fixture
async def repo():
    return UserRepository()

@pytest.mark.asyncio
async def test_create_user_success(repo, async_session):
    user = User(id=None, email="test@example.com")
    created = await repo.create_user(user, async_session)
    assert isinstance(created, User)
    assert created.id is not None
    assert created.email == "test@example.com"
    # Check persisted
    result = await async_session.execute(
        UserTable.__table__.select().where(UserTable.email == "test@example.com")
    )
    db_user = result.fetchone()
    assert db_user is not None

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
