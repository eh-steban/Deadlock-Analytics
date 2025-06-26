from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import os
import httpx

router = APIRouter()

STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/id"
REALM = "http://localhost:8000"
RETURN_TO = f"{REALM}/auth/callback"

@router.get("/login")
async def login():
    query = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": RETURN_TO,
        "openid.realm": REALM,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    print(f"[login] query: {query}")

    url = f"{STEAM_OPENID_ENDPOINT}?{urlencode(query)}"
    print(f"[login] url: {url}")
    
    response = RedirectResponse(url)
    print(f"[login] Redirecting to: {response.headers['Location']}")
    print(f"[login] Response status code: {response.status_code}")
    print(f"[login] Response headers: {response.headers}")
    print(f"[login] Response: {response}")
    return response

@router.get("/callback")
async def callback(request: Request):
    query_params = dict(request.query_params)
    print(f"[callback] query_params (initial): {query_params}")

    # Append mode=check_authentication
    query_params["openid.mode"] = "check_authentication"
    print(f"[callback] query_params (with mode): {query_params}")

    async with httpx.AsyncClient() as client:
        resp = await client.post(STEAM_OPENID_ENDPOINT, data=query_params)
        print(f"[callback] POST response: {resp.text}")
    
    if "is_valid:true" not in resp.text:
        print(f"[callback] Invalid OpenID response: {resp.text}")
        raise HTTPException(status_code=400, detail="Invalid OpenID response")

    # Extract steam ID from openid.steamid
    steamid = request.query_params.get("openid.steamid")
    print(f"[callback] steamid: {steamid}")
    if not steamid or not steamid.startswith("https://steamcommunity.com/openid/id/"):
        print(f"[callback] Steam ID not found or invalid: {steamid}")
        raise HTTPException(status_code=400, detail="Steam ID not found")

    steam_id = steamid.split("/")[-1]
    print(f"[callback] steam_id: {steam_id}")
    return {"steam_id": steam_id}
