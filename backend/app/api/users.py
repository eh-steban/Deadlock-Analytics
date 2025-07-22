from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, status
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.models import User
from app.infra.db.session import get_session
from app.services.user_service import UserService

router = APIRouter()

@router.get("/find/{user_id}", response_model=Optional[User])
async def get_user(user_id: int, session: Annotated[AsyncSession, Depends(get_session)]):
    service = UserService()
    user = await service.get_user_by_id(user_id, session)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/new", response_model=User)
async def new_user() -> User:
    return User()

@router.post("/create", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: User, session: Annotated[AsyncSession, Depends(get_session)]):
    try:
        return await UserService().create_user(user, session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))