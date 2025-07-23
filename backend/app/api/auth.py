import re
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from openid.consumer.consumer import Consumer
from typing import Annotated
from app.services.auth.manage_jwt_token import create_access_token
from app.services.user_service import UserService
from app.infra.db.session import get_session
from app.config import Settings, get_settings

router = APIRouter()

STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid"
STEAM_OPENID_IDENTITY_PATTERN = r".*\/(?P<steam_id>[^/]+)$"
REALM = "http://localhost:8000"
RETURN_TO = f"{REALM}/auth/callback"
logger = logging.getLogger("uvicorn.error")

SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]

@router.get("/login")
async def login():
    consumer = Consumer({}, None)
    auth_begin = consumer.begin(STEAM_OPENID_ENDPOINT)
    redirect_url = auth_begin.redirectURL(REALM, RETURN_TO)
    
    response = RedirectResponse(url=redirect_url)
    return response

@router.get("/callback")
async def callback(request: Request, session: SessionDep, settings: SettingsDep):
    consumer = Consumer({}, None)
    response = consumer.complete(request.query_params, RETURN_TO)
    if response.status != "success" or not response.identity_url:
        raise HTTPException(status_code=403, detail="Steam login failed")

    identity_url = response.identity_url
    steam_id: str = extract_steam_id(identity_url)
    user = await UserService().find_user_by_steam_id(steam_id, session)

    if user is None:
        user = await UserService().create_user(steam_id, session)
        logger.info(f"User created with Steam ID: {steam_id}")

    assert user.id is not None, "User ID should never be None after creation"
    access_token = create_access_token(user_id=user.id, settings=settings)
    logger.info(f"User logged in with Steam ID: {steam_id}")
    return {"access_token": access_token, "token_type": "bearer"}

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
