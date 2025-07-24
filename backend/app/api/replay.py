import logging
import base64
from fastapi import APIRouter, HTTPException
from app.services.deadlock_api_service import DeadlockAPIService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/match_replay_url/{match_id}")
async def get_match_replay_url(match_id: int) -> str:
    api_service = DeadlockAPIService()
    demo_url_dict = await api_service.get_demo_url(match_id)
    demo_url = demo_url_dict.get("demo_url")
    if demo_url is None:
        raise HTTPException(status_code=404, detail="Demo URL not found for match {match_id}")

    logger.info(f"Demo url ({demo_url}) for match ID: {match_id}")
    encoded_demo_url = base64.urlsafe_b64encode(demo_url.encode()).decode()
    return encoded_demo_url