from fastapi import APIRouter, HTTPException, status
from app.domain.user import User
from app.services.user_service import UserService

router = APIRouter()

@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    service = UserService()
    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/new", response_model=User)
async def new_user() -> User:
    return User(id=None, email=None)

@router.post("/users/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: User):
    service = UserService()
    return await service.create_user(user)
