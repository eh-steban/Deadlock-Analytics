from typing import Optional, Annotated
from fastapi import Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from psycopg.errors import UniqueViolation
from app.infra.db.session import get_db_session
from app.infra.db.models import User

class UserRepository:
    async_session: Annotated[AsyncSession, Depends(get_db_session)]

    async def create_user(self, hashed_steam_id: str, encrypted_steam_id: str, session: Annotated[AsyncSession, Depends(get_db_session)]) -> User:
        db_user = User(hashed_steam_id=hashed_steam_id, encrypted_steam_id=encrypted_steam_id)
        try:
            session.add(db_user)
            await session.commit()
            await session.refresh(db_user)
        except IntegrityError as integrity_error:
            if isinstance(integrity_error.orig, UniqueViolation):
                raise UniqueViolation(f"User with Steam ID {db_user.hashed_steam_id} already exists") from integrity_error
            raise Exception(f"Error creating user: {integrity_error}") from integrity_error
        except Exception as e:
            raise Exception(f"Error creating user: {e}") from e
        return User(
            id=db_user.id,
            hashed_steam_id=db_user.hashed_steam_id,
            encrypted_steam_id=db_user.encrypted_steam_id,
            email=db_user.email
        )

    async def get_user_by_id(self, id: int, session: Annotated[AsyncSession, Depends(get_db_session)]) -> Optional[User]:
        stmt = select(User).where(User.id == id)
        result = await session.execute(stmt)
        db_user = result.scalar_one_or_none()
        if db_user:
            return User(
            id=db_user.id,
            hashed_steam_id=db_user.hashed_steam_id,
            encrypted_steam_id=db_user.encrypted_steam_id,
            email=db_user.email
        )
        return None

    async def get_user_by_steam_id(self, hashed_steam_id: str, session: Annotated[AsyncSession, Depends(get_db_session)]) -> Optional[User]:
        stmt = select(User).where(User.hashed_steam_id == hashed_steam_id)
        result = await session.execute(stmt)
        db_user = result.scalar_one_or_none()
        if db_user:
            return User(
            id=db_user.id,
            hashed_steam_id=db_user.hashed_steam_id,
            encrypted_steam_id=db_user.encrypted_steam_id,
            email=db_user.email
        )
        return None