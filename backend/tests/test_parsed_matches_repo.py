import pytest
from tests.test_helper import setup_database, async_session
from app.repo.parsed_matches_repo import ParsedMatchesRepo
from app.infra.db.parsed_match_payload import ParsedMatchPayload
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

MATCH_ID = 1
SCHEMA_VERSION = 1
PAYLOAD = {"foo": "bar"}
ETAG = "etag123"

@pytest.fixture
def repo():
    return ParsedMatchesRepo()

@pytest.mark.asyncio
async def test_get_payload_success(repo, async_session):
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, PAYLOAD, ETAG, async_session)
    result = await repo.get_payload(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == PAYLOAD

@pytest.mark.asyncio
async def test_get_payload_not_found(repo, async_session):
    with pytest.raises(MatchDataUnavailableException):
        await repo.get_payload(2, 1, async_session)

@pytest.mark.asyncio
async def test_get_payload_integrity_error(repo, async_session):
    record = ParsedMatchPayload(
        match_id=MATCH_ID,
        schema_version=SCHEMA_VERSION,
        payload_json=None,
        etag=ETAG
    )
    async_session.add(record)
    await async_session.commit()
    with pytest.raises(MatchDataIntegrityException):
        await repo.get_payload(MATCH_ID, SCHEMA_VERSION, async_session)

@pytest.mark.asyncio
async def test_get_payload_db_error(repo, async_session):
    await async_session.close()
    with pytest.raises(MatchDataUnavailableException):
        await repo.get_payload(2, 1, async_session)

@pytest.mark.asyncio
async def test_upsert_payload_insert(repo, async_session):
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, PAYLOAD, ETAG, async_session)
    result = await repo.get_payload(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == PAYLOAD

@pytest.mark.asyncio
async def test_upsert_payload_update(repo, async_session):
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, PAYLOAD, ETAG, async_session)
    new_payload = {"foo": "baz"}
    new_etag = "etag456"
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, new_payload, new_etag, async_session)
    result = await repo.get_payload(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == new_payload

@pytest.mark.asyncio
async def test_upsert_payload_db_error(repo, async_session):
    await async_session.close()
    with pytest.raises(MatchDataIntegrityException):
        await repo.upsert_payload("MATCH_ID", SCHEMA_VERSION, PAYLOAD, ETAG, async_session)

@pytest.mark.asyncio
async def test_exists_true(repo, async_session):
    record = ParsedMatchPayload(
        match_id=MATCH_ID,
        schema_version=SCHEMA_VERSION,
        payload_json=PAYLOAD,
        etag=ETAG
    )
    async_session.add(record)
    await async_session.commit()
    result = await repo.exists(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result is True

@pytest.mark.asyncio
async def test_exists_false(repo, async_session):
    result = await repo.exists(2, 1, async_session)
    assert result is False
