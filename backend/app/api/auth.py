import re
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from openid.consumer.consumer import Consumer
from typing import Annotated
from app.services.auth.manage_jwt_token import create_access_token
from app.services.user_service import UserService
from app.infra.db.session import get_db_session
from app.config import Settings, get_settings
from app.utils.logger import get_logger

router = APIRouter()

STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid"
STEAM_OPENID_IDENTITY_PATTERN = r".*\/(?P<steam_id>[^/]+)$"
logger = get_logger(__name__)

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]

@router.get("/login")
async def login(settings: SettingsDep):
    consumer = Consumer({}, None)
    auth_begin = consumer.begin(STEAM_OPENID_ENDPOINT)

    return_url = f"{settings.BACKEND_BASE_URL}/auth/callback"
    redirect_url = auth_begin.redirectURL(settings.BACKEND_BASE_URL, return_url)

    response = RedirectResponse(url=redirect_url)
    return response

@router.get("/callback")
async def callback(request: Request, session: SessionDep, settings: SettingsDep):
    consumer = Consumer({}, None)
    return_url = f"{settings.BACKEND_BASE_URL}/auth/callback"
    response = consumer.complete(request.query_params, return_url)
    if response.status != "success" or not response.identity_url:
        logger.error(f"Steam login failed: {response.status} - {response.message}")
        raise HTTPException(status_code=403, detail="Steam login failed")

    identity_url = response.identity_url
    steam_id: str = extract_steam_id(identity_url)
    user = await UserService().find_user_by_steam_id(steam_id, session)

    if user is None:
        user = await UserService().create_user(steam_id, session)
        logger.info(f"User created with Steam ID: {steam_id}")

    assert user.id is not None, "User ID should never be None after creation"
    jwt = create_access_token(user_id=user.id, settings=settings)
    logger.info(f"User logged in with Steam ID: {steam_id}")

    redirect_url = f"{settings.FRONTEND_BASE_URL}/profile/{steam_id}"
    response = RedirectResponse(url=redirect_url)
    response.set_cookie(
        key="access_token",
        value=jwt,
        httponly=True,
        secure=False,  # FIXME: Set to True in production
        samesite="strict",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response

@router.post("/logout")
async def logout(response: JSONResponse):
    resp = JSONResponse(content={"detail": "Successfully logged out."})
    resp.delete_cookie("access_token")
    return resp

# Helper function to extract Steam ID from OpenID identity URL
def extract_steam_id(identity_url: str) -> str:
    match = re.search(STEAM_OPENID_IDENTITY_PATTERN, identity_url)
    if not match:
        raise HTTPException(status_code=403, detail=f"Failed to extract Steam ID: {identity_url}")
    return match.group("steam_id")
