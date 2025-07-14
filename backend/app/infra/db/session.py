from typing import Annotated
# from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# from sqlalchemy.orm import sessionmaker
from fastapi import Depends
from app.config import Settings, get_settings

# SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
# DATABASE_URL = Settings.DATABASE_URL

async def get_session(settings: SettingsDep = Depends(get_settings)):
    # FIXME: This runs in any env, but should only run in dev/test
    # In production, we'll likely want `echo=False`
    connect_args = {"check_same_thread": False}
    database_url = settings.DATABASE_URL
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

# @app.post("/heroes/")
# async def create_hero(hero: Hero, session: SessionDep) -> Hero:
#     session.add(hero)
#     await session.commit()
#     await session.refresh(hero)
#     return hero