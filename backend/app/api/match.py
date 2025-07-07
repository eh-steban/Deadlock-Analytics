from fastapi import APIRouter
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.match_response import MatchResponse

router = APIRouter()
api_service = DeadlockAPIService()

@router.get("/{match_id}/metadata", response_model=MatchResponse)
async def get_match_metadata(match_id: str):
    return await api_service.get_match_metadata(match_id)
