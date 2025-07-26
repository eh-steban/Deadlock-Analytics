from fastapi import APIRouter
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.deadlock_api import MatchMetadata

router = APIRouter()
api_service = DeadlockAPIService()

@router.get("/analysis/{match_id}", response_model=MatchMetadata)
async def get_match_analysis(match_id: str):
    return await api_service.get_match_metadata_for(match_id)
