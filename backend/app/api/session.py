import logging
from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth.manage_jwt_token import decode_access_token
from app.config import Settings, get_settings
from app.infra.db.session import get_db_session
from app.infra.db.models import User
from app.services.user_service import UserService

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSessionDep = Annotated[AsyncSession, Depends(get_db_session)]

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/current_user/{jwt}")
async def current_user(jwt: str, settings: SettingsDep, session: DbSessionDep) -> User:
    logger.info("Client requested current user session.")
    if not jwt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT token is required",
        )
    user = await get_current_user(settings=settings, token=jwt, session=session)
    return user

async def get_current_user(settings: SettingsDep, token: str, session: DbSessionDep) -> User:
    try:
        user_id = decode_access_token(token, settings=settings)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        user = await UserService().find_user_by_id(user_id, session)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        logger.info(f"User {user_id} authenticated successfully.")
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
