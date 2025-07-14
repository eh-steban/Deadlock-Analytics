from typing import Annotated, Optional
from fastapi import Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.session import get_session
from app.infra.db.models import UserTable
from app.domain.user import User

class UserRepository:
    def __init__(self):
        self.session: AsyncSession = get_session()

    async def create_user(self, user: User) -> bool:
        db_user = UserTable(email=user.email)
        self.session.add(db_user)
        return True

    async def get_user_by_id(self, id: int) -> Optional[User]:
        result = await self.session.execute(
            select(UserTable).where(UserTable.id == id)
        )
        db_user = result.scalar_one_or_none()
        if db_user:
            return User(id=db_user.id, email=db_user.email)
        return None