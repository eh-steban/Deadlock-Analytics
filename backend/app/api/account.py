
from fastapi import APIRouter, HTTPException
from app.domain.steam_account_response import SteamAccountResponse
from app.services.deadlock_api_service import DeadlockAPIService

router = APIRouter()
    
@router.get("{steam_id}/match_history", response_model=SteamAccountResponse)
async def my_account_match_history(steam_id: str) -> list:
    try:
        api_service = DeadlockAPIService()
        return await api_service.get_account_match_history(steam_id)
    except HTTPException:
        raise HTTPException(status_code=403, detail="Steam ID is required for this operation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
