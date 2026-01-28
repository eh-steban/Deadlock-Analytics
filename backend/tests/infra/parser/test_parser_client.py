import pytest
import time
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from app.infra.parser.parser_client import ParserClient, CircuitBreaker
from app.domain.exceptions import ParserServiceError


# Circuit Breaker Tests
@pytest.mark.asyncio
async def test_circuit_breaker_starts_closed():
    cb = CircuitBreaker(failure_threshold=3, timeout=60)
    assert cb.state == "closed"
    assert cb.failures == 0


@pytest.mark.asyncio
async def test_circuit_breaker_opens_after_threshold():
    cb = CircuitBreaker(failure_threshold=3, timeout=60)

    async def failing_func():
        raise ParserServiceError("test error")

    for _ in range(3):
        with pytest.raises(ParserServiceError):
            await cb.call(failing_func)

    assert cb.state == "open"
    assert cb.failures == 3


@pytest.mark.asyncio
async def test_circuit_breaker_rejects_calls_when_open():
    cb = CircuitBreaker(failure_threshold=2, timeout=60)

    async def failing_func():
        raise ParserServiceError("test error")

    # Trigger open state
    for _ in range(2):
        with pytest.raises(ParserServiceError):
            await cb.call(failing_func)

    assert cb.state == "open"

    # Should reject subsequent calls
    async def success_func():
        return "success"

    with pytest.raises(ParserServiceError, match="Circuit breaker open"):
        await cb.call(success_func)


@pytest.mark.asyncio
async def test_circuit_breaker_enters_half_open_after_timeout():
    cb = CircuitBreaker(failure_threshold=2, timeout=1)  # 1 second timeout

    async def failing_func():
        raise ParserServiceError("test error")

    # Trigger open state
    for _ in range(2):
        with pytest.raises(ParserServiceError):
            await cb.call(failing_func)

    assert cb.state == "open"

    # Wait for timeout
    time.sleep(1.1)

    # Next call should enter half-open
    async def success_func():
        return "success"

    result = await cb.call(success_func)
    assert result == "success"
    assert cb.state == "closed"
    assert cb.failures == 0


# ParserClient Tests
@pytest.mark.asyncio
async def test_check_demo_available_returns_true():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.json.return_value = {
        "available": True,
        "filename": "12345_67890.dem"
    }
    mock_response.raise_for_status = MagicMock()

    with patch.object(client.client, 'get', return_value=mock_response):
        available, filename = await client.check_demo_available(12345)

    assert available is True
    assert filename == "12345_67890.dem"


@pytest.mark.asyncio
async def test_check_demo_available_returns_false():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.json.return_value = {"available": False}
    mock_response.raise_for_status = MagicMock()

    with patch.object(client.client, 'get', return_value=mock_response):
        available, filename = await client.check_demo_available(12345)

    assert available is False
    assert filename is None


@pytest.mark.asyncio
async def test_check_demo_timeout_raises_parser_error():
    client = ParserClient()

    async def mock_get(*args, **kwargs):
        raise httpx.TimeoutException("timeout")

    with patch.object(client.client, 'get', side_effect=mock_get):
        with pytest.raises(ParserServiceError, match="timeout"):
            await client.check_demo_available(12345)


@pytest.mark.asyncio
async def test_check_demo_connect_error_raises_parser_error():
    client = ParserClient()

    async def mock_get(*args, **kwargs):
        raise httpx.ConnectError("connection refused")

    with patch.object(client.client, 'get', side_effect=mock_get):
        with pytest.raises(ParserServiceError, match="Failed to connect"):
            await client.check_demo_available(12345)


@pytest.mark.asyncio
async def test_check_demo_http_404_raises_parser_error():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_response.text = "Not found"

    async def mock_get(*args, **kwargs):
        raise httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)

    with patch.object(client.client, 'get', side_effect=mock_get):
        with pytest.raises(ParserServiceError, match="404"):
            await client.check_demo_available(12345)


@pytest.mark.asyncio
async def test_check_demo_http_500_raises_parser_error():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal error"

    async def mock_get(*args, **kwargs):
        raise httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)

    with patch.object(client.client, 'get', side_effect=mock_get):
        with pytest.raises(ParserServiceError, match="500"):
            await client.check_demo_available(12345)


@pytest.mark.asyncio
async def test_parse_demo_success():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.json.return_value = {"players": [], "damage": []}
    mock_response.raise_for_status = MagicMock()

    with patch.object(client.client, 'post', return_value=mock_response):
        result = await client.parse_demo("encoded_url")

    assert result == {"players": [], "damage": []}


@pytest.mark.asyncio
async def test_parse_demo_timeout_raises_parser_error():
    client = ParserClient()

    async def mock_post(*args, **kwargs):
        raise httpx.TimeoutException("timeout")

    with patch.object(client.client, 'post', side_effect=mock_post):
        with pytest.raises(ParserServiceError, match="timeout"):
            await client.parse_demo("encoded_url")


@pytest.mark.asyncio
async def test_parse_demo_connect_error_raises_parser_error():
    client = ParserClient()

    async def mock_post(*args, **kwargs):
        raise httpx.ConnectError("connection refused")

    with patch.object(client.client, 'post', side_effect=mock_post):
        with pytest.raises(ParserServiceError, match="Failed to connect"):
            await client.parse_demo("encoded_url")


@pytest.mark.asyncio
async def test_parse_demo_http_error_raises_parser_error():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal error"

    async def mock_post(*args, **kwargs):
        raise httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)

    with patch.object(client.client, 'post', side_effect=mock_post):
        with pytest.raises(ParserServiceError, match="500"):
            await client.parse_demo("encoded_url")


@pytest.mark.asyncio
async def test_parse_demo_http_400_raises_parser_error():
    client = ParserClient()

    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.text = "Bad request"

    async def mock_post(*args, **kwargs):
        raise httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)

    with patch.object(client.client, 'post', side_effect=mock_post):
        with pytest.raises(ParserServiceError, match="400"):
            await client.parse_demo("encoded_url")


@pytest.mark.asyncio
async def test_circuit_breaker_trips_after_repeated_failures():
    client = ParserClient()
    client.circuit_breaker = CircuitBreaker(failure_threshold=3, timeout=60)

    async def mock_get(*args, **kwargs):
        raise httpx.TimeoutException("timeout")

    # First 3 failures should trip the circuit
    for i in range(3):
        with patch.object(client.client, 'get', side_effect=mock_get):
            with pytest.raises(ParserServiceError):
                await client.check_demo_available(12345)

    assert client.circuit_breaker.state == "open"

    # Next call should fail immediately without hitting the service
    with pytest.raises(ParserServiceError, match="Circuit breaker open"):
        await client.check_demo_available(12345)
