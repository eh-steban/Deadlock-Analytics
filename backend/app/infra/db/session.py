from typing import Annotated
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from fastapi import Depends
from app.config import Settings, get_settings

SettingsDep = Annotated[Settings, Depends(get_settings)]

async def get_session(settings: SettingsDep = Depends(get_settings)):
    connect_args = {"check_same_thread": False}
    database_url = settings.DATABASE_URL
    # FIXME: This runs in any env, but should only run in dev/test
    # In production, we'll likely want `echo=False`
    engine = create_async_engine(database_url, connect_args=connect_args, echo=True)
    async with AsyncSession(engine) as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()