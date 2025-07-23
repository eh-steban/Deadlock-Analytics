import logging
from fastapi import APIRouter, Depends, HTTPException
from app.services.deadlock_api_service import DeadlockAPIService
from app.services.user_service import UserService
from app.domain.deadlock_api import MatchSummary
from app.infra.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{match_id}/download_match_replay")
async def download_match_replay_for(match_id: int, session: Annotated[AsyncSession, Depends(get_session)]) -> str:
    # FIXME: Hardcoding a match_id for testing purposes
    match_id = 38108272
    api_service = DeadlockAPIService()
    demo_url_dict = await api_service.get_demo_url(match_id)
    demo_url = demo_url_dict.get("demo_url")
    if demo_url is None:
        raise HTTPException(status_code=404, detail="Demo URL not found for match {match_id}")

    logger.info(f"Downloading replay for match ID: {match_id} from URL: {demo_url}")
    return await api_service.get_and_download_replay(demo_url, match_id)
