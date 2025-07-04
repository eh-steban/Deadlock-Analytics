from fastapi import APIRouter, HTTPException
from app.services.account_service import AccountService
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient
from app.domain.match.match_history import MatchHistoryResponse
from app.config import settings

router = APIRouter()

api_client = DeadlockAPIClient()
dl_api_service = DeadlockAPIService(api_client)

@router.get("/account/{steam_id}/match_history", response_model=AccountResponse)
async def account_match_history_for(steam_id: str) -> list:
    try:
        return dl_api_service.fetch_account_match_history(steam_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
