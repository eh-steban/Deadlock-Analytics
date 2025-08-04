import httpx
from fastapi import APIRouter, HTTPException
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.match_analysis import MatchAnalysis
from app.api.replay import get_match_replay_url
from app.config import get_settings

router = APIRouter()
api_service = DeadlockAPIService()
settings = get_settings()
PARSER_SERVICE_URL = settings.PARSER_SERVICE_URL

@router.get("/analysis/{match_id}", response_model=MatchAnalysis)
async def get_match_analysis(match_id: int):
    replay_url = await get_match_replay_url(match_id)

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            game_data = await client.post(
                PARSER_SERVICE_URL,
                json={"demo_url": replay_url},
                headers={"Content-Type": "application/json"}
            )
            game_data.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Rust service error: {e.response.status_code} - {e.response.text}")

    match_metadata = await api_service.get_match_metadata_for(match_id)
    try:
        analysis = MatchAnalysis(match_metadata=match_metadata, parsed_game_data=game_data.json())
    except Exception as e:
        print(f"Error occurred while creating MatchAnalysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return analysis
