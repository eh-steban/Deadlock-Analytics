from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.user import User
from app.services.user_service import UserService
from app.infra.db.session import get_session

router = APIRouter()

@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)):
    service = UserService(session)
    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/new", response_model=User)
async def new_user() -> User:
    return User(id=None, email=None)

@router.post("/users/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: User, session: AsyncSession = Depends(get_session)):
    service = UserService(session)
    return await service.create_user(user)
