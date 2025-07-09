import re
import logging
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from openid.consumer.consumer import Consumer
from app.services.auth.manage_jwt_token import create_access_token

router = APIRouter()

STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid"
STEAM_OPENID_IDENTITY_PATTERN = r".*\/(?P<steam_id>[^/]+)$"
REALM = "http://localhost:8000"
RETURN_TO = f"{REALM}/auth/callback"
logger = logging.getLogger("uvicorn.error")

@router.get("/login")
async def login():
    consumer = Consumer({}, None)
    auth_begin = consumer.begin(STEAM_OPENID_ENDPOINT)
    redirect_url = auth_begin.redirectURL(REALM, RETURN_TO)
    
    response = RedirectResponse(url=redirect_url)
    return response

@router.get("/callback")
async def callback(request: Request):
    consumer = Consumer({}, None)
    response = consumer.complete(request.query_params, RETURN_TO)
    if response.status != "success" or not response.identity_url:
        raise HTTPException(status_code=403, detail="Steam login failed")

    identity_url = response.identity_url
    steam_id = extract_steam_id(identity_url)
    access_token = create_access_token(data={"steam_id": steam_id})
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
