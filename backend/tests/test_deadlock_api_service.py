import pytest
import pytest_asyncio
from app.services.deadlock_api_service import DeadlockAPIService
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient

@pytest_asyncio.fixture
def api_client():
    return DeadlockAPIClient()

@pytest_asyncio.fixture
def dl_api_service(api_client):
    return DeadlockAPIService(api_client)

@pytest.mark.asyncio
async def test_fetch_account_match_history(httpx_mock, dl_api_service):
    url = dl_api_service.api_url(f"/v1/players/12345678901234567/match-history")
    expected = [
        {
            "account_id": 1,
            "match_id": 1,
            "hero_id": 1,
            "hero_level": 1,
        },
        {
            "account_id": 2,
            "match_id": 2,
            "hero_id": 2,
            "hero_level": 2,
        }
    ]
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await dl_api_service.fetch_account_match_history(12345678901234567)
    assert result == expected

@pytest.mark.asyncio
@pytest.mark.skip
async def test_failed_fetch_account_match_history(httpx_mock, dl_api_service):
    url = dl_api_service.api_url(f"/v1/players/12345678901234567/match-history")
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await dl_api_service.fetch_account_match_history(12345678901234567)
    assert "403" in str(excinfo.value)

@pytest.mark.asyncio
async def test_fetch_match_metadata(httpx_mock, dl_api_service):
    url = dl_api_service.api_url(f"/v1/matches/12345678/metadata")
    expected = {"meta": "data"}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await dl_api_service.fetch_match_metadata(12345678)
    assert result == expected

@pytest.mark.asyncio
@pytest.mark.skip
async def test_failed_fetch_match_metadata(httpx_mock, dl_api_service):
    url = dl_api_service.api_url(f"/v1/matches/12345678/metadata")
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await dl_api_service.fetch_match_metadata(12345678)
    assert "403" in str(excinfo.value)

@pytest.mark.asyncio
async def test_fetch_demo_url(httpx_mock, dl_api_service):
    url = dl_api_service.api_url(f"/v1/matches/12345678/salts")
    expected = {"demo_url": dl_api_service.api_url(f"http://example.com/1234567.dem.bz2")}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await dl_api_service.fetch_demo_url(12345678)
    assert result == expected

@pytest.mark.asyncio
@pytest.mark.skip
async def test_failed_fetch_demo_url(httpx_mock, dl_api_service):
    url = dl_api_service.api_url(f"/v1/matches/12345678/salts")
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await dl_api_service.fetch_demo_url(12345678)
    assert "403" in str(excinfo.value)