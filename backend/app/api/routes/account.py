from fastapi import APIRouter, HTTPException
from app.domain.steam_account_response import SteamAccountResponse
from app.services.deadlock_api_service import DeadlockAPIService

router = APIRouter()

@router.get("/account/{steam_id}/match_history", response_model=SteamAccountResponse)
async def account_match_history_for(steam_id: str) -> list:
    try:
        api_service = DeadlockAPIService()
        return await api_service.get_account_match_history(steam_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
