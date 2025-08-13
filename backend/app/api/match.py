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
    # At the top, check if ParsedMatchPayload exists in DB for match_id and schema_version
    # If it exists:
    #     - Use repo.get_payload to fetch the parsed payload
    #     - Set game_data to the fetched payload
    #     - Continue with analysis logic below using game_data
    # If it does not exist:
    #     - Continue with current flow: get replay_url, call Rust Haste service, fetch match payload
    #     - After fetching, use repo.upsert_payload to store the payload in DB
    #     - Continue with analysis logic using the new payload
    replay_url = await get_match_replay_url(match_id)

    if not replay_url:
        raise HTTPException(status_code=404, detail="Replay URL not found for the match")
    # If we did not find a parsed payload, this is where we fetch the replay and call the Rust service
    # After fetching and parsing, upsert the payload into the DB using repo.upsert_payload
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
    # After successful parse, upsert the new payload into the DB

    match_metadata = await api_service.get_match_metadata_for(match_id)

    match_info = match_metadata.match_info
    player_info_list = match_info.players
    player_paths_list = match_info.match_paths.paths
    parsed_players = [ParsedPlayer(**p) for p in game_data.json().get("players", [])]
    player_list, npc_list = await PlayerService().map_player_data(parsed_players, player_info_list, player_paths_list)

    try:
        analysis = MatchAnalysis(match_metadata=match_metadata, parsed_game_data=game_data.json(), players=player_list, npcs=npc_list)
    except Exception as e:
        print(f"Error occurred while creating MatchAnalysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # --- ETag integration ---
    from fastapi import Request, Response
    from app.utils.http_cache import compute_etag, respond_if_not_modified
    schema_version = 1  # Replace with actual version if needed
    payload_dict = game_data.json()  # Use the canonical payload
    etag = compute_etag(payload_dict, schema_version)
    # Accept If-None-Match header
    request_etag = None
    import inspect
    for frame in inspect.stack():
        if 'request' in frame.frame.f_locals:
            request = frame.frame.f_locals['request']
            request_etag = request.headers.get('if-none-match')
            break
    not_modified_response = respond_if_not_modified(request_etag or "", etag)
    if not_modified_response:
        return not_modified_response
    response = Response(content=game_data.text, media_type="application/json")
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "public, max-age=300"
    return response
    # At the end, consider ETag integration for response caching and 304 support
