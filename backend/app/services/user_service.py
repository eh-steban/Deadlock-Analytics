from typing import Optional, Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.models import User
from app.infra.db.session import get_session
from app.repo.users_repo import UserRepository

class UserService:
    async def create_user(self, user: User, session: Annotated[AsyncSession, Depends(get_session)]) -> User:
        return await UserRepository().create_user(user, session=session)

    async def get_user_by_id(self, user_id: int, session: Annotated[AsyncSession, Depends(get_session)]) -> Optional[User]:
        return await UserRepository().get_user_by_id(user_id, session=session)
