from typing import Optional, Annotated
from fastapi import Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from psycopg.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError
from app.infra.db.session import get_session
from app.infra.db.models import User

class UserRepository:
    async_session: Annotated[AsyncSession, Depends(get_session)]

    async def create_user(self, steam_id: str, session: Annotated[AsyncSession, Depends(get_session)]) -> User:
        db_user = User(steam_id=steam_id)
        try:
            session.add(db_user)
            await session.commit()
            await session.refresh(db_user)
        except IntegrityError as integrity_error:
            if isinstance(integrity_error.orig, UniqueViolation):
                raise UniqueViolation(f"User with Steam ID {db_user.steam_id} already exists") from integrity_error
            raise Exception(f"Error creating user: {integrity_error}") from integrity_error
        except Exception as e:
            raise Exception(f"Error creating user: {e}") from e
        return User(id=db_user.id, steam_id=db_user.steam_id, email=db_user.email)

    async def get_user_by_id(self, id: int, session: Annotated[AsyncSession, Depends(get_session)]) -> Optional[User]:
        stmt = select(User).where(User.id == id)
        result = await session.execute(stmt)
        db_user = result.scalar_one_or_none()
        if db_user:
            return User(id=db_user.id, steam_id=db_user.steam_id, email=db_user.email)
        return None

    async def get_user_by_steam_id(self, steam_id: str, session: Annotated[AsyncSession, Depends(get_session)]) -> Optional[User]:
        stmt = select(User).where(User.steam_id == steam_id)
        result = await session.execute(stmt)
        db_user = result.scalar_one_or_none()
        if db_user:
            return User(id=db_user.id, steam_id=db_user.steam_id, email=db_user.email)
        return None