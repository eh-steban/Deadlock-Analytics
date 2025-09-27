import base64
import gzip
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
from app.services.transform_service import TransformService
from app.repo.parsed_matches_repo import ParsedMatchesRepo
from app.domain.match_analysis import (
    MatchAnalysis,
    ParsedGameData,
    ParsedMatchResponse,
    ParsedAttackerVictimMap,
    Positions
)
from app.domain.player import ParsedPlayer
from app.infra.db.session import get_db_session
from app.config import Settings, get_settings
from app.utils.http_cache import compute_etag, check_if_not_modified
from app.domain.exceptions import (
    DeadlockAPIError,
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
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
    per_player_data: ParsedGameData | None

    try:
        # 1. Check if we have game data cached in DB
        per_player_data = await repo.get_per_player_data(
            match_id, schema_version, session
        )
        if per_player_data:
            # 2. If we have it, compute ETag and check If-None-Match
            etag = compute_etag(per_player_data.model_dump(), schema_version)
            if request_etag := request.headers.get("If-None-Match"):
                not_modified_response = check_if_not_modified(request_etag, etag)
                if not_modified_response:
                    return Response(
                        status_code=status.HTTP_304_NOT_MODIFIED,
                        headers={"ETag": etag, "Cache-Control": "public, max-age=300"},
                    )
        else:
            # 3. Need to fetch from parser service
            demo = await deadlock_api_service.get_demo_url(match_id)
            replay_url = demo.get("demo_url")
            if not replay_url:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Replay URL not found for the match",
                )
            logger.info(f"Replay url ({replay_url}) for match ID: {match_id}")
            encoded_replay_url = base64.urlsafe_b64encode(
                replay_url.encode()
            ).decode()
            async with httpx.AsyncClient(timeout=300.0) as client:
                try:
                    parsed_resp = await client.post(
                        f"{settings.PARSER_BASE_URL}/parse",
                        json={"demo_url": encoded_replay_url},
                        headers={"Content-Type": "application/json"},
                    )
                    parsed_resp.raise_for_status()

                    parsed_json_resp = parsed_resp.json()
                    parsed_players = (
                        [ParsedPlayer(**p) for p in parsed_json_resp.get("players", [])]
                    )

                    parsed_damage = [
                        ParsedAttackerVictimMap(**d) for d in parsed_json_resp.get("damage", {})
                    ]
                    seconds = parsed_json_resp.get("seconds", 0)
                    positions = Positions(parsed_json_resp.get("positions", []))
                    parsed_match = ParsedMatchResponse(
                        seconds=seconds,
                        damage=parsed_damage,
                        players=parsed_players,
                        positions=positions
                    )
                    per_player_data = TransformService.to_per_player_data(parsed_match)
                except httpx.HTTPStatusError as e:
                    raise HTTPException(
                        status_code=e.response.status_code,
                        detail=f"Rust service error: {e.response.status_code} - {e.response.text}",
                    )

                etag = compute_etag(per_player_data.model_dump(), schema_version)
                await repo.create_parsed_match(
                    match_id,
                    schema_version,
                    gzip.compress(parsed_match.model_dump_json().encode("utf-8")),
                    parsed_match.seconds,
                    per_player_data.model_dump(),
                    etag,
                    session,
                )

    except MatchDataUnavailableException:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Parsed payload missing in DB",
        )
    except MatchDataIntegrityException as e:
        logger.exception("Failed to store parsed payload in DB: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store parsed payload in DB",
        )
    except SQLAlchemyError as db_err:
        logger.exception(
            "Database error while fetching parsed payload for match_id=%s", match_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while fetching parsed payload",
        )
    except DeadlockAPIError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadlock API error occurred. Check logs for details.",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Unhandled error while building match analysis for match_id=%s. Error: %s",
            match_id,
            e,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

    match_metadata = await deadlock_api_service.get_match_metadata_for(match_id)

    # Prepare analysis
    match_info = match_metadata.match_info
    player_info_list = match_info.players

    player_list, npc_list = await PlayerService().map_player_data(
        per_player_data.players, player_info_list
    )
    analysis = MatchAnalysis(
        match_metadata=match_metadata,
        parsed_game_data=per_player_data,
        players=player_list,
        npcs=npc_list,
    )

    response = Response(
        content=json.dumps(analysis.model_dump()), media_type="application/json"
    )
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "public, max-age=300"
    return response
