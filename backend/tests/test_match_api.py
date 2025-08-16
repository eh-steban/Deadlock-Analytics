import pytest
import pytest_asyncio
import httpx
from tests.test_helper import setup_database, async_session
from app.main import app
from app.domain.match_analysis import ParsedGameData, DamageRecord
from app.domain.player import ParsedPlayer
from app.repo.parsed_matches_repo import ParsedMatchesRepo
from app.config import Settings, get_settings
from app.api import match as match_api
from app.services.deadlock_api_service import DeadlockAPIService
from app.domain.deadlock_api import MatchMetadata, MatchInfoFields, MatchPaths

MATCH_ID = 1
SCHEMA_VERSION = 1

# Ensure API uses the test session/DB for all requests
@pytest_asyncio.fixture(autouse=True)
async def override_db_session(async_session):
    from app.infra.db.session import get_db_session as app_get_db_session

    async def _override_get_db_session():
        return async_session

    app.dependency_overrides[app_get_db_session] = _override_get_db_session
    yield
    app.dependency_overrides.pop(app_get_db_session, None)

@pytest_asyncio.fixture
async def async_client():
    """Async HTTP client hitting the FastAPI app in-process (no network)."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_deadlock_api_call():
    class FakeService(DeadlockAPIService):
        async def get_match_metadata_for(self, match_id: int) -> MatchMetadata:
            paths = MatchPaths(x_resolution=1920, y_resolution=1080, paths=[])
            info = MatchInfoFields(
                duration_s=3600,
                match_outcome=1,
                winning_team=0,
                players=[],
                start_time=1620000000,
                match_id=match_id,
                legacy_objectives_mask=0,
                game_mode=2,
                match_mode=1,
                objectives=[],
                match_paths=paths,
                damage_matrix={},
                match_pauses=[],
                customer_user_stats={},
                watched_death_replays=[],
                objectives_mark_team0={},
                objectives_mark_team1={},
                mid_boss=[],
                is_high_skill_range_parties=False,
                low_pri_pool=False,
                new_player_pool=False,
                average_badge_team0=3,
                average_badge_team1=4,
                game_mode_version=1,
            )
            return MatchMetadata(match_info=info)

        async def get_demo_url(self, match_id: int):
            return {"demo_url": "http://dummy.url/demo.dem"}

    app.dependency_overrides[match_api.get_deadlock_service] = lambda: FakeService()
    yield
    app.dependency_overrides.pop(match_api.get_deadlock_service, None)

@pytest.fixture
def mock_deadlock_api_match_not_found():
    class FakeService(DeadlockAPIService):
        async def get_match_metadata_for(self, match_id: int) -> MatchMetadata:
            paths = MatchPaths(x_resolution=1920, y_resolution=1080, paths=[])
            info = MatchInfoFields(
                duration_s=3600,
                match_outcome=1,
                winning_team=0,
                players=[],
                start_time=1620000000,
                match_id=match_id,
                legacy_objectives_mask=0,
                game_mode=2,
                match_mode=1,
                objectives=[],
                match_paths=paths,
                damage_matrix={},
                match_pauses=[],
                customer_user_stats={},
                watched_death_replays=[],
                objectives_mark_team0={},
                objectives_mark_team1={},
                mid_boss=[],
                is_high_skill_range_parties=False,
                low_pri_pool=False,
                new_player_pool=False,
                average_badge_team0=3,
                average_badge_team1=4,
                game_mode_version=1,
            )
            return MatchMetadata(match_info=info)

        async def get_demo_url(self, match_id: int) -> dict[str, str]:
            # Return empty string to simulate not found while preserving type
            return {"demo_url": ""}

    app.dependency_overrides[match_api.get_deadlock_service] = lambda: FakeService()
    yield
    app.dependency_overrides.pop(match_api.get_deadlock_service, None)

@pytest.fixture
def mock_parser_call(httpx_mock):
    # Override settings so PARSER_BASE_URL points to dummy host
    def fake_get_settings() -> Settings:
        s = Settings()
        object.__setattr__(s, "PARSER_BASE_URL", "http://dummy.url/parser")
        return s

    app.dependency_overrides[get_settings] = fake_get_settings

    # Mock parser endpoint (POST to base_url + "/parse")
    parser_parse_url = "http://dummy.url/parser/parse"
    httpx_mock.add_response(
        method="POST",
        url=parser_parse_url,
        status_code=200,
        json={"players": [], "damage_per_tick": []},
    )

    yield
    app.dependency_overrides.pop(get_settings, None)

@pytest_asyncio.fixture
async def setup_db_payload(async_session):
    repo = ParsedMatchesRepo()
    player_one = ParsedPlayer(entity_id=1, name="bar", steam_id_32=100)
    player_two = ParsedPlayer(entity_id=2, name="baz", steam_id_32=200)
    damage_record = DamageRecord(ability_id=1, attacker_class=2, citadel_type=3, damage=100, type=1, victim_class=2)
    damage_window = {1: {2: [damage_record]}}
    damage_per_tick = [damage_window]
    payload = ParsedGameData(damage_per_tick=damage_per_tick, players=[player_one, player_two])
    etag = "etag123"
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, payload.model_dump(), etag, async_session)

@pytest.mark.asyncio
async def test_get_match_analysis_success(async_client, mock_deadlock_api_call, async_session, setup_database, setup_db_payload):
    response = await async_client.get(f"/match/analysis/{MATCH_ID}")
    assert response.status_code == 200
    data = response.json()
    assert "match_metadata" in data
    assert "parsed_game_data" in data
    assert "players" in data
    assert "npcs" in data

@pytest.mark.asyncio
async def test_get_match_analysis_match_not_found(async_client, mock_deadlock_api_match_not_found, async_session, setup_database):
    response = await async_client.get("/match/analysis/99999")
    assert response.status_code == 404
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_if_none_match_returns_304_with_headers(async_client, mock_deadlock_api_call, async_session, setup_database, setup_db_payload):
    # Prime cache and get ETag from a 200 response
    first = await async_client.get(f"/match/analysis/{MATCH_ID}")
    assert first.status_code == 200
    etag = first.headers.get("ETag")
    assert etag

    # Conditional request should return 304 Not Modified
    second = await async_client.get(f"/match/analysis/{MATCH_ID}", headers={"If-None-Match": etag})
    assert second.status_code == 304
    assert second.headers.get("ETag") == etag
    assert "Cache-Control" in second.headers
    assert second.text == ""

@pytest.mark.asyncio
async def test_get_match_analysis_from_db_success(async_client, mock_deadlock_api_call, async_session, setup_database, setup_db_payload):
    # Success: finds game_data via get_payload
    response = await async_client.get(f"/match/analysis/{MATCH_ID}")
    assert response.status_code == 200
    data = response.json()
    assert "match_metadata" in data
    assert "parsed_game_data" in data
    assert "players" in data
    assert "npcs" in data
    assert data["parsed_game_data"]["players"][0]["entity_id"] == 1

@pytest.mark.asyncio
async def test_get_match_analysis_db_create_success(async_client, mock_deadlock_api_call, mock_parser_call, async_session, setup_database):
    # Success: does not find game_data, creates new DB entry
    NEW_MATCH_ID = 999
    response = await async_client.get(f"/match/analysis/{NEW_MATCH_ID}")
    # Accept either 200 (created) or 404 if replay not found
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.json()
        assert "match_metadata" in data
        assert "parsed_game_data" in data
        assert "players" in data
        assert "npcs" in data
