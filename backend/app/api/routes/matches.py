from fastapi import APIRouter, HTTPException
from app.services.match.match_service import MatchService
from app.infra.deadlock_api.client import DeadlockAPIClient
from app.domain.match.match_history import MatchHistoryResponse

router = APIRouter()

api_client = DeadlockAPIClient()
service = MatchService(api_client)

@router.get("/matches/{steam_id}", response_model=MatchHistoryResponse)
async def get_match_history(steam_id: str):
    try:
        return await service.fetch_match_history(steam_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
