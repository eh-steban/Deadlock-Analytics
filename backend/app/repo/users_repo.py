from typing import Optional
from fastapi import Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.session import get_session
from app.infra.db.models import UserTable
from app.domain.user import User

class UserRepository:
    async def create_user(self, user: User, session: AsyncSession = Depends(get_session)) -> User:
        db_user = UserTable(email=user.email)
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
        return User(id=db_user.id, email=db_user.email)

    async def get_user_by_id(self, id: int, session: AsyncSession = Depends(get_session)) -> Optional[User]:
        result = await session.execute(
            select(UserTable).where(UserTable.id == id)
        )
        db_user = result.scalar_one_or_none()
        if db_user:
            return User(id=db_user.id, email=db_user.email)
        return None