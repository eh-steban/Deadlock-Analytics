import base64
import gzip
import httpx
import json
import sys
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
from app.domain.boss import BossData
from app.domain.player import PlayerData
from app.services.deadlock_api_service import DeadlockAPIService
# from app.services.player_service import PlayerService
from app.services.transform_service import TransformService
from app.repo.parsed_games_repo import ParsedMatchesRepo
from app.domain.match_analysis import (
    GameAnalysis,
    TransformedGameData,
    ParsedGameResponse,
    ParsedAttackerVictimMap,
    Positions
)
# from app.domain.player import PlayerInfo
from app.infra.db.session import get_db_session
from app.config import Settings, get_settings
from app.utils.http_cache import compute_etag, check_if_not_modified
from app.utils.logger import get_logger
from app.domain.exceptions import (
    DeadlockAPIError,
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

router = APIRouter()
logger = get_logger(__name__)

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]

def get_deadlock_service() -> DeadlockAPIService:
    return DeadlockAPIService()

ServiceDep = Annotated[DeadlockAPIService, Depends(get_deadlock_service)]

@router.get("/analysis/{match_id}", response_model=GameAnalysis)
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
    game_data: TransformedGameData | None = None

    try:
        # 1. Check if we have game data cached in DB
        game_data = await repo.get_game_data(
            match_id, schema_version, session
        )
        if game_data:
            # 2. If we have it, compute ETag and check If-None-Match
            etag = compute_etag(game_data.model_dump(), schema_version)
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
                logger.debug(f"Replay url for match ID ({match_id}) not found.")
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

                    raw_response_size = len(parsed_resp.content)
                    logger.info(f"Match {match_id} - Raw parser response size: {raw_response_size:,} bytes ({raw_response_size / 1024:.2f} KB, {raw_response_size / (1024 * 1024):.2f} MB)")

                    parsed_json_resp = parsed_resp.json()
                    players_list = (
                        [PlayerData(**p) for p in parsed_json_resp.get("players", [])]
                    )
                    parsed_damage = [
                        ParsedAttackerVictimMap(**d) for d in parsed_json_resp.get("damage", {})
                    ]
                    # positions =
                    parsed_game = ParsedGameResponse(
                        total_game_time_s=parsed_json_resp.get("total_game_time_s", 0),
                        game_start_time_s=parsed_json_resp.get("game_start_time_s", 0),
                        damage=parsed_damage,
                        players_data=players_list,
                        positions=Positions(parsed_json_resp.get("positions", [])),
                        bosses=BossData(**parsed_json_resp.get("bosses", {}))
                    )

                    # Measure compressed parsed_game size
                    compressed_parsed_game = gzip.compress(parsed_game.model_dump_json().encode("utf-8"))
                    compressed_size = len(compressed_parsed_game)
                    logger.info(f"Match {match_id} - Compressed parsed_game size: {compressed_size:,} bytes ({compressed_size / 1024:.2f} KB, {compressed_size / (1024 * 1024):.2f} MB)")

                    # player_list, npc_list = await PlayerService().map_player_data(
                    #     game_data.players, players_list
                    # )
                    game_data = TransformService.to_game_data(parsed_game)

                    # Measure game_data size
                    game_data_json = json.dumps(game_data.model_dump())
                    game_data_size = len(game_data_json.encode("utf-8"))
                    game_data_memory = sys.getsizeof(game_data)
                    logger.info(f"Match {match_id} - game_data JSON size: {game_data_size:,} bytes ({game_data_size / 1024:.2f} KB, {game_data_size / (1024 * 1024):.2f} MB)")
                    logger.info(f"Match {match_id} - game_data in-memory size: {game_data_memory:,} bytes ({game_data_memory / 1024:.2f} KB, {game_data_memory / (1024 * 1024):.2f} MB)")

                    # Log compression ratio
                    uncompressed_size = len(parsed_game.model_dump_json().encode("utf-8"))
                    compression_ratio = (1 - compressed_size / uncompressed_size) * 100
                    logger.info(f"Match {match_id} - Compression ratio: {compression_ratio:.1f}% (uncompressed: {uncompressed_size:,} bytes, {uncompressed_size / 1024:.2f} KB, {uncompressed_size / (1024 * 1024):.2f} MB)")

                except httpx.HTTPStatusError as e:
                    raise HTTPException(
                        status_code=e.response.status_code,
                        detail=f"Rust service error: {e.response.status_code} - {e.response.text}",
                    )

                etag = compute_etag(game_data.model_dump(), schema_version)
                await repo.create_parsed_game(
                    match_id,
                    schema_version,
                    gzip.compress(parsed_game.model_dump_json().encode("utf-8")),
                    game_data.model_dump(),
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
    except DeadlockAPIError as dl_api_err:
        logger.exception(
            "Deadlock API error occurred for match_id=%s. Error: %s",
            match_id,
            dl_api_err,
        )
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
    # match_info = match_metadata.match_info
    # players_list = match_info.players
    analysis = GameAnalysis(
        match_metadata=match_metadata,
        parsed_game_data=game_data,
    )

    response_content = json.dumps(analysis.model_dump())
    response = Response(
        content=response_content, media_type="application/json"
    )
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "public, max-age=300"

    response_size = len(response_content.encode('utf-8'))
    game_time_minutes = analysis.parsed_game_data.total_game_time_s / 60
    logger.info(
        f"Match analysis for match_id={match_id} served with ETag={etag}. "
        f"Game time={game_time_minutes:.2f} minutes ({analysis.parsed_game_data.total_game_time_s}s). "
        f"Response size={response_size:,} bytes ({response_size / 1024:.2f} KB, {response_size / (1024 * 1024):.2f} MB)"
    )
    return response
