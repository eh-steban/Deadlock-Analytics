import pytest
import pytest_asyncio
import httpx
import os
import aiofiles
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient

@pytest_asyncio.fixture
async def client():
    c = DeadlockAPIClient()
    yield c
    await c.close()

@pytest.mark.asyncio
async def test_get_dict_success(httpx_mock, client):
    url = "https://api.test-example.com/"
    httpx_mock.add_response(url=url, status_code=200, json={"message": "ok"})
    result = await client.get(url)
    assert result == {"message": "ok"}

@pytest.mark.asyncio
async def test_get_list_success(httpx_mock, client):
    url = "https://api.test-example.com/"
    httpx_mock.add_response(url=url, status_code=200, json=[{"message": "ok"}])
    result = await client.get(url)
    assert result == [{"message": "ok"}]

@pytest.mark.asyncio
async def test_get_failure(httpx_mock, client):
    url = "https://api.test-example.com/fail"
    httpx_mock.add_response(url=url, status_code=403, json="forbidden")
    with pytest.raises(Exception) as excinfo:
        await client.get(url)
    assert "403" in str(excinfo.value)
