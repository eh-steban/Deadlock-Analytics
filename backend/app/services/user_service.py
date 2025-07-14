from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.user import User
from app.repo.users_repo import UserRepository

class UserService:
    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)

    async def create_user(self, user: User) -> User:
        return await self.repo.create_user(user)

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        return await self.repo.get_user_by_id(user_id)
