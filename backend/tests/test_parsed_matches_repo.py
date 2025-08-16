import pytest
from app.domain.player import ParsedPlayer
from tests.test_helper import setup_database, async_session
from app.domain.match_analysis import DamageRecord
from app.repo.parsed_matches_repo import ParsedMatchesRepo
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

MATCH_ID = 1
SCHEMA_VERSION = 1
ETAG = "etag123"
PLAYER_ONE = ParsedPlayer(entity_id=1, name="bar", steam_id_32=100)
PLAYER_TWO = ParsedPlayer(entity_id=2, name="baz", steam_id_32=200)
DAMAGE_RECORD_ONE = DamageRecord(ability_id=1, attacker_class=2, citadel_type=3, damage=100, type=1, victim_class=2)
DAMAGE_RECORD_TWO = DamageRecord(ability_id=2, attacker_class=3, citadel_type=4, damage=200, type=2, victim_class=3)
# Ensure nested values are plain dicts for JSONB storage
damage_window = {"1": {"2": [DAMAGE_RECORD_ONE.model_dump(), DAMAGE_RECORD_TWO.model_dump()]}}
damage_per_tick = [damage_window]

PAYLOAD = {
    "damage_per_tick": damage_per_tick,
    "players": [PLAYER_ONE.model_dump(), PLAYER_TWO.model_dump()],
}

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
    result = await repo.get_payload(2, 1, async_session)
    assert result is None

@pytest.mark.asyncio
async def test_upsert_payload_insert(repo, async_session):
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, PAYLOAD, ETAG, async_session)
    result = await repo.get_payload(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == PAYLOAD

@pytest.mark.asyncio
async def test_upsert_payload_update(repo, async_session):
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, PAYLOAD, ETAG, async_session)
    modified_players = [
        ParsedPlayer(entity_id=3, name=PLAYER_ONE.name, steam_id_32=PLAYER_ONE.steam_id_32).model_dump(),
        PLAYER_TWO.model_dump(),
    ]
    modified_payload = {
        "damage_per_tick": damage_per_tick,
        "players": modified_players,
    }
    new_etag = "etag456"
    await repo.upsert_payload(MATCH_ID, SCHEMA_VERSION, modified_payload, new_etag, async_session)
    result = await repo.get_payload(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == modified_payload

@pytest.mark.asyncio
async def test_upsert_payload_db_error(repo, async_session):
    await async_session.close()
    with pytest.raises(MatchDataIntegrityException):
        await repo.upsert_payload("MATCH_ID", SCHEMA_VERSION, PAYLOAD, ETAG, async_session)
