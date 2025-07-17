from typing import Optional
from app.domain.user import User
from app.repo.users_repo import UserRepository

class UserService:
    async def create_user(self, user: User) -> User:
        return await UserRepository().create_user(user)

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        return await UserRepository().get_user_by_id(user_id)
