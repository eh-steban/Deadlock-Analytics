import pytest

from sqlmodel import select
from app.repo.users_repo import UserRepository
from app.infra.db.models import User
from tests.test_helper import setup_database, async_session
from sqlalchemy.exc import IntegrityError

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
        select(User).where(User.email == "test@example.com")
    )
    db_user = result.scalar_one_or_none()
    assert db_user

@pytest.mark.asyncio
async def test_create_user_fail_duplicate_email(repo, async_session):
    user = User(id=None, email="test@example.com")
    await repo.create_user(user, async_session)
    with pytest.raises(IntegrityError):
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