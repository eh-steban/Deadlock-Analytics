import os
import httpx
import re
import logging
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from openid.consumer.consumer import Consumer

router = APIRouter()

STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid"
REALM = "http://localhost:8001"
RETURN_TO = f"{REALM}/auth/callback"
logger = logging.getLogger("uvicorn.error")

@router.get("/login")
async def login():
    consumer = Consumer({}, None)
    auth_begin = consumer.begin(STEAM_OPENID_ENDPOINT)
    redirect_url = auth_begin.redirectURL(REALM, RETURN_TO)
    
    response = RedirectResponse(url=redirect_url)
    logger.debug(f"[login] Redirecting to: {response.headers['Location']}")
    logger.debug(f"[login] Response status code: {response.status_code}")
    logger.debug(f"[login] Response headers: {response.headers}")
    logger.debug(f"[login] Response: {response}")
    return response

@router.get("/callback")
async def callback(request: Request):
    logger.info
    consumer = Consumer({}, None)
    response = consumer.complete(request.query_params, RETURN_TO)
    logger.debug(f"[callback] OpenID response: {response}")
    if response.status != "success":
        return None

    identity_url = response.identity_url
    pattern = r"https://steamcommunity\.com/openid/id/(?P<steam_id>\d+)"
    match = re.search(pattern, identity_url)
    if not match:
        raise HTTPException(status_code=403, detail=f"Failed to extract Steam ID: {identity_url}")
    
    steam_id = match.group("steam_id")
    return {"steam_id": steam_id}
