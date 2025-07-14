from pydantic import BaseModel
from app.repo.users_repo import UserRepository

UserRepository = UserRepository()

class User(BaseModel):
    id: int | None
    email: str  | None

    @classmethod
    async def create_user(cls, email: str) -> 'User':
        user = cls(email=email)
        return await UserRepository.create_user(user)

    @classmethod
    async def get_user_by_id(cls, user_id: int) -> 'User | None':
        return await UserRepository.get_user_by_id(user_id)