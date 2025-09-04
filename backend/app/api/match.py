import base64
import httpx
import json
import logging
from typing import Annotated
from fastapi import (
    APIRouter,
    HTTPException,
    Request,
    Response,
    status,
    Depends
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.services.deadlock_api_service import DeadlockAPIService
from app.services.player_service import PlayerService
from app.repo.parsed_matches_repo import ParsedMatchesRepo
from app.domain.match_analysis import MatchAnalysis, ParsedGameData
from app.domain.player import ParsedPlayer
from app.infra.db.session import get_db_session
from app.config import Settings, get_settings
from app.utils.http_cache import compute_etag, check_if_not_modified
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException
)

router = APIRouter()
logger = logging.getLogger(__name__)

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]

def get_deadlock_service() -> DeadlockAPIService:
    return DeadlockAPIService()

ServiceDep = Annotated[DeadlockAPIService, Depends(get_deadlock_service)]

@router.get("/analysis/{match_id}", response_model=MatchAnalysis)
async def get_match_analysis(
    request: Request,
    match_id: int,
    session: SessionDep,
    settings: SettingsDep,
    deadlock_api_service: ServiceDep,
):

    schema_version = 1
    repo = ParsedMatchesRepo()
    etag = ""

    try:
        # Fetch existing payload from DB
        payload_dict = await repo.get_payload(match_id, schema_version, session)

        if payload_dict:
            etag = compute_etag(payload_dict, schema_version)
            # Check for `if-none-match` header and return a 304 if the client's ETag matches
            if request_etag := request.headers.get("If-None-Match"):
                not_modified_response = check_if_not_modified(request_etag, etag)
                if not_modified_response:
                    response = Response(
                        status_code=status.HTTP_304_NOT_MODIFIED,
                        headers={"ETag": etag, "Cache-Control": "public, max-age=300"}
                    )
                    return response
        else:
            # If we don't have a payload, get replay URL and parse it
            demo = await deadlock_api_service.get_demo_url(match_id)
            replay_url = demo.get("demo_url")

            if not replay_url:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Replay URL not found for the match"
                )

            logger.info(f"Replay url ({replay_url}) for match ID: {match_id}")
            encoded_replay_url = base64.urlsafe_b64encode(replay_url.encode()).decode()

            # Send `replay_url` to parser service
            async with httpx.AsyncClient(timeout=300.0) as client:
                try:
                    parse_resp = await client.post(
                        f"{settings.PARSER_BASE_URL}/parse",
                        json={"demo_url": encoded_replay_url},
                        headers={"Content-Type": "application/json"}
                    )
                    parse_resp.raise_for_status()
                    payload_dict = parse_resp.json()
                except httpx.HTTPStatusError as e:
                    raise HTTPException(
                        status_code=e.response.status_code,
                        detail=f"Rust service error: {e.response.status_code} - {e.response.text}"
                    )

            # Upsert new payload into DB
            etag = compute_etag(payload_dict, schema_version)
            await repo.upsert_payload(match_id, schema_version, payload_dict, etag, session)

    except MatchDataUnavailableException:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Parsed payload missing in DB"
        )
    except MatchDataIntegrityException:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store parsed payload in DB"
        )
    except SQLAlchemyError as db_err:
        logger.exception("Database error while fetching parsed payload for match_id=%s", match_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while fetching parsed payload"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unhandled error while building match analysis for match_id=%s", match_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )

    match_metadata = await deadlock_api_service.get_match_metadata_for(match_id)

    # Prepare analysis
    match_info = match_metadata.match_info
    player_info_list = match_info.players
    player_paths_list = match_info.match_paths.paths
    parsed_players = [ParsedPlayer(**p) for p in payload_dict.get("players", [])]
    player_list, npc_list = await PlayerService().map_player_data(
        parsed_players,
        player_info_list,
        player_paths_list
    )
    analysis = MatchAnalysis(
        match_metadata=match_metadata,
        parsed_game_data=ParsedGameData(**payload_dict),
        players=player_list,
        npcs=npc_list
    )

    response = Response(content=json.dumps(analysis.model_dump()), media_type="application/json")
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "public, max-age=300"
    return response
