import os
import pytest_asyncio
# os.environ['ENVIRONMENT'] = 'test'
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# Default to dashjump-db (Docker network), fallback to localhost
# Override with TEST_DATABASE_URL environment variable for other setups
DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://deadlock:deadlockpass@dashjump-db:5432/deadlock_test_db"
)

# Use NullPool to ensure connection cleanup
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@pytest_asyncio.fixture(scope="class", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest_asyncio.fixture(scope="class")
async def async_session():
    async with engine.begin() as conn:
        trans = await conn.begin_nested()
        async with AsyncSessionLocal(bind=conn) as session:
            yield session
        await trans.rollback()
