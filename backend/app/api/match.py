import httpx
from fastapi import APIRouter, HTTPException
from app.services.deadlock_api_service import DeadlockAPIService
from app.services.player_service import PlayerService
from app.domain.match_analysis import MatchAnalysis
from app.domain.player import ParsedPlayer
from app.api.replay import get_match_replay_url
from app.config import get_settings

router = APIRouter()
api_service = DeadlockAPIService()
settings = get_settings()
PARSER_BASE_URL = settings.PARSER_BASE_URL

@router.get("/analysis/{match_id}", response_model=MatchAnalysis)
async def get_match_analysis(match_id: int):
    replay_url = await get_match_replay_url(match_id)

    if not replay_url:
        raise HTTPException(status_code=404, detail="Replay URL not found for the match")
    # Call Haste Parser service to parse the replay
    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            game_data = await client.post(
                f"{PARSER_BASE_URL}/parse",
                json={"demo_url": replay_url},
                headers={"Content-Type": "application/json"}
            )
            game_data.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Rust service error: {e.response.status_code} - {e.response.text}")

    match_metadata = await api_service.get_match_metadata_for(match_id)

    match_info = match_metadata.match_info
    player_info_list = match_info.players
    player_paths_list = match_info.match_paths.paths
    parsed_players = [ParsedPlayer(**p) for p in game_data.json().get("players", [])]
    entity_to_custom_id_list = game_data.json().get("entity_id_to_custom_player_id", {})

    player_list, npc_list = await PlayerService().map_player_data(parsed_players, entity_to_custom_id_list, player_info_list, player_paths_list)

    try:
        analysis = MatchAnalysis(match_metadata=match_metadata, parsed_game_data=game_data.json(), players=player_list, npcs=npc_list)
    except Exception as e:
        print(f"Error occurred while creating MatchAnalysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return analysis
