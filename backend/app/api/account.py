import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.deadlock_api import MatchSummary
from app.domain.steam_account import SteamPlayer
from app.config import get_settings, Settings

router = APIRouter()
logger = logging.getLogger(__name__)
SettingsDep = Annotated[Settings, Depends(get_settings)]

@router.get("/match_history/{steam_id}", response_model=list[MatchSummary])
async def get_account_match_history(steam_id: str):
    api_service = DeadlockAPIService()
    return await api_service.get_account_match_history_for(steam_id)

@router.get("/steam/{steam_id}", response_model=SteamPlayer)
async def get_steam_account_details(steam_id: str, settings: SettingsDep):
    url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/"
    params = {
        "key": settings.STEAM_WEB_API_KEY,
        "steamids": steam_id
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        try:
            response.raise_for_status()
            data = response.json()
            player_data = data["response"]["players"][0]
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to fetch Steam account details: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except (KeyError, IndexError) as e:
            logger.error(f"Failed to parse Steam account details: {e}")
            raise HTTPException(status_code=404, detail="Steam player not found")
        return SteamPlayer.model_validate(player_data)