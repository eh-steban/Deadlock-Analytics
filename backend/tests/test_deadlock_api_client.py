import pytest
import pytest_asyncio
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
    expected = {"meta": "data"}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await client.fetch_match_metadata("456")
    assert result == expected

@pytest.mark.asyncio
async def test_fetch_salts_success(httpx_mock, client):
    url = client.api_url("/v1/matches/789/salts")
    expected = {"demo_url": "http://example.com/789.dem.bz2", "salt": 12345}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await client.fetch_salts(789)
    assert result == expected
