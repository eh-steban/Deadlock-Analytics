from typing import Optional, Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.models import User
from app.infra.db.session import get_session
from app.repo.users_repo import UserRepository
from app.utils.steam_id_utils import encrypt_steam_id, hash_steam_id

class UserService:
    async def create_user(self, steam_id: str, session: Annotated[AsyncSession, Depends(get_session)]) -> User:
        hashed_steam_id = hash_steam_id(steam_id)
        encrypted_steam_id: str = encrypt_steam_id(steam_id)
        return await UserRepository().create_user(hashed_steam_id, encrypted_steam_id, session=session)

    async def find_user_by_id(self, user_id: int, session: Annotated[AsyncSession, Depends(get_session)]) -> Optional[User]:
        return await UserRepository().get_user_by_id(user_id, session=session)

    async def find_user_by_steam_id(self, steam_id: str, session: Annotated[AsyncSession, Depends(get_session)]) -> Optional[User]:
        hashed_steam_id = hash_steam_id(steam_id)
        return await UserRepository().get_user_by_steam_id(hashed_steam_id, session=session)