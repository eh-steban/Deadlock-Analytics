import pytest
import pytest_asyncio
from app.domain.deadlock_api import MatchMetadata, MatchInfoFields
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient

@pytest_asyncio.fixture
async def client():
    c = DeadlockAPIClient()
    yield c
    await c.client.aclose()

@pytest.mark.asyncio
async def test_call_api_success(httpx_mock, client):
    url = client.api_url("/v1/players/1234567/match-history")
    httpx_mock.add_response(url=url, status_code=200)
    response = await client.call_api(url)
    request = httpx_mock.get_requests()[0]
    assert request.headers["X-API-Key"] == client.api_key
    assert response.status_code == 200

@pytest.mark.asyncio
@pytest.mark.parametrize("status_code", [400, 404, 429, 500])
async def test_call_api_failed(httpx_mock, client, status_code):
    url = client.api_url("/v1/players/bad-request/match-history")
    httpx_mock.add_response(url=url, status_code=status_code)
    with pytest.raises(Exception) as excinfo:
        await client.call_api(url)
    msg = str(excinfo.value)
    assert "call_api" in msg
    assert str(status_code) in msg

@pytest.mark.asyncio
async def test_fetch_account_match_history_success(httpx_mock, client):
    url = client.api_url("/v1/players/123/match-history")
    expected = [
        {"account_id": 1, "match_id": 1, "hero_id": 1, "hero_level": 1},
        {"account_id": 2, "match_id": 2, "hero_id": 2, "hero_level": 2}
    ]
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await client.fetch_account_match_history("123")
    assert result == expected

@pytest.mark.asyncio
async def test_fetch_match_metadata_success(httpx_mock, client):
    url = client.api_url("/v1/matches/456/metadata")
    match_info = MatchInfoFields(
        duration_s=3600,
        match_outcome=1,
        winning_team=0,
        players=[{"name": "Alice"}],
        start_time=1620000000,
        match_id=456,
        legacy_objectives_mask=0,
        game_mode=2,
        match_mode=1,
        objectives=[{"objective": "win"}],
        match_paths={"path": [1, 2, 3]},
        damage_matrix={"player1": 100},
        match_pauses=[],
        customer_user_stats={"stat": 42},
        watched_death_replays=[],
        objectives_mark_team0={"foo": "bar"},
        objectives_mark_team1={"baz": "qux"},
        mid_boss=[{"boss": "dragon"}],
        is_high_skill_range_parties=False,
        low_pri_pool=False,
        new_player_pool=False,
        average_badge_team0=3,
        average_badge_team1=4,
        game_mode_version=1
    )
    expected = MatchMetadata(match_info=match_info)
    httpx_mock.add_response(url=url, status_code=200, json=expected.model_dump())
    result = await client.fetch_match_metadata("456")
    assert result == expected

@pytest.mark.asyncio
async def test_fetch_salts_success(httpx_mock, client):
    url = client.api_url("/v1/matches/789/salts")
    expected = {"demo_url": "http://example.com/789.dem.bz2", "salt": 12345}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await client.fetch_salts(789)
    assert result == expected
