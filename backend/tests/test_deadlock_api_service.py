import pytest
import pytest_asyncio
import aiofiles
import os
import json
from app.services.deadlock_api_service import DeadlockAPIService
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient

@pytest_asyncio.fixture
def api_client():
    return DeadlockAPIClient()

@pytest_asyncio.fixture
def dl_api_service(api_client):
    return DeadlockAPIService(api_client)

@pytest.mark.asyncio
async def test_fetch_account_match_history(httpx_mock, dl_api_service, tmp_path, monkeypatch):
    url = "https://data.test-api.com/v1/players/123/match-history"
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
    monkeypatch.chdir(tmp_path)
    result = await dl_api_service.fetch_account_match_history(123)
    assert result == expected

@pytest.mark.asyncio
@pytest.mark.skip
async def test_failed_fetch_account_match_history(httpx_mock, dl_api_service):
    url = "https://data.test-api.com/v1/players/123/match-history"
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await dl_api_service.fetch_account_match_history(123)
    assert "403" in str(excinfo.value)

@pytest.mark.asyncio
async def test_fetch_match_metadata(httpx_mock, dl_api_service):
    url = "https://data.test-api.com/v1/matches/456/metadata"
    expected = {"meta": "data"}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await dl_api_service.fetch_match_metadata(456)
    assert result == expected

@pytest.mark.asyncio
@pytest.mark.skip
async def test_failed_fetch_match_metadata(httpx_mock, dl_api_service):
    url = "https://data.test-api.com/v1/matches/456/metadata"
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await dl_api_service.fetch_match_metadata(456)
    assert "403" in str(excinfo.value)

@pytest.mark.asyncio
async def test_fetch_demo_url(httpx_mock, dl_api_service):
    url = "https://data.test-api.com/v1/matches/1234567/demo-url"
    expected = {"demo_url": "http://example.com/1234567.dem.bz2"}
    httpx_mock.add_response(url=url, status_code=200, json=expected)
    result = await dl_api_service.fetch_demo_url(1234567)
    assert result == expected

@pytest.mark.asyncio
@pytest.mark.skip
async def test_failed_fetch_demo_url(httpx_mock, dl_api_service):
    url = "https://data.test-api.com/v1/matches/789/demo-url"
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await dl_api_service.fetch_demo_url(789)
    assert "403" in str(excinfo.value)