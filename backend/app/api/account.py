from fastapi import APIRouter
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.deadlock_api import MatchSummary

router = APIRouter()

@router.get("/{steam_id}/match_history", response_model=list[MatchSummary])
async def account_match_history_for(steam_id: str):
    api_service = DeadlockAPIService()
    return await api_service.get_account_match_history_for(steam_id)
