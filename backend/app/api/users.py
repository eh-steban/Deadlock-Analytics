from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, status
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.models import User
from app.infra.db.session import get_session
from app.services.user_service import UserService

router = APIRouter()

@router.get("/find-by-id/{user_id}", response_model=Optional[User])
async def find_user_by_id(user_id: int, session: Annotated[AsyncSession, Depends(get_session)]):
    user = await UserService().find_user_by_id(user_id, session)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/find-by-steam-id/{steam_id}", response_model=Optional[User])
async def find_user_by_steam_id(steam_id: str, session: Annotated[AsyncSession, Depends(get_session)]):
    user = await UserService().find_user_by_steam_id(steam_id, session)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/create/{steam_id}", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(steam_id: str, session: Annotated[AsyncSession, Depends(get_session)]):
    try:
        return await UserService().create_user(steam_id, session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))