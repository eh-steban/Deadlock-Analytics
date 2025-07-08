from fastapi import APIRouter
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.deadlock_api import MatchMetadata

router = APIRouter()
api_service = DeadlockAPIService()

@router.get("/{match_id}/metadata", response_model=MatchMetadata)
async def match_metadata_for(match_id: str):
    return await api_service.get_match_metadata_for(match_id)
