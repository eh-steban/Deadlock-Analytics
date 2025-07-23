from typing import Annotated, AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from fastapi import Depends
from app.config import Settings, get_settings

async def get_session(settings: Annotated[Settings, Depends(get_settings)]) -> AsyncGenerator[AsyncSession, None]:
    connect_args = {"check_same_thread": False}
    database_url = settings.DATABASE_URL

    # FIXME: This runs in any env, but should only run in dev/test
    # In production, we'll likely want `echo=False`
    engine = create_async_engine(database_url, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise