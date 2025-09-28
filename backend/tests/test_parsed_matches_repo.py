import pytest
import gzip
import json
from app.domain.player import ParsedPlayer
from tests.test_helper import setup_database, async_session
from app.domain.match_analysis import DamageRecord, ParsedGameData, PlayerPosition
from app.repo.parsed_matches_repo import ParsedMatchesRepo
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

MATCH_ID = 1
SCHEMA_VERSION = 1
ETAG = "etag123"
PLAYER_ONE = ParsedPlayer(entity_id="1", custom_player_id="11", name="bar", steam_id_32=100)
PLAYER_TWO = ParsedPlayer(entity_id="2", custom_player_id="12", name="baz", steam_id_32=200)
PLAYERS = [PLAYER_ONE, PLAYER_TWO]
PLAYER_POSITIONS: list[PlayerPosition | None] = [
    PlayerPosition(player_id="11", x=100.5, y=200.25, z=64.0),  # second 0
    None,                                                       # second 1 (no sample)
    PlayerPosition(player_id="11", x=101.0, y=201.0, z=64.5),   # second 2
    None,                                                       # second 3
    PlayerPosition(player_id="11", x=103.2, y=205.8, z=65.0),   # second 4
]
DAMAGE_RECORD_ONE = DamageRecord(ability_id=1, attacker_class=2, citadel_type=3, damage=100, type=1, victim_class=2)
DAMAGE_RECORD_TWO = DamageRecord(ability_id=2, attacker_class=3, citadel_type=4, damage=200, type=2, victim_class=3)
# Ensure nested values are plain dicts for JSONB storage
DAMAGE_WINDOW = {"1": {"2": [DAMAGE_RECORD_ONE.model_dump(), DAMAGE_RECORD_TWO.model_dump()]}}
DAMAGE_PER_SECOND = [DAMAGE_WINDOW]
RAW_JSON = {"players": [PLAYER_ONE.model_dump(), PLAYER_TWO.model_dump()], "damage": DAMAGE_PER_SECOND, "positions": []}
RAW_GZIP = gzip.compress(json.dumps(RAW_JSON).encode())

PER_PLAYER_DATA = {
    "players": [PLAYER_ONE.model_dump(), PLAYER_TWO.model_dump()],
    "per_player_data": {
        # custom_player_id "11"
        "11": {
            "positions": PLAYER_POSITIONS,
            "damage": [
                # Tick 0: attacker "11" did damage to victim "2"
                {
                    "2": [
                        DAMAGE_RECORD_ONE.model_dump(),
                        DAMAGE_RECORD_TWO.model_dump(),
                    ]
                },
                # Tick 1: no damage
                {},
            ],
        },
        # custom_player_id "12"
        "12": {
            "positions": [],
            "damage": [
                {},  # Tick 0 no damage
                {},  # Tick 1 no damage
            ],
        },
    },
}

PARSED_GAME_DATA = ParsedGameData(**PER_PLAYER_DATA)

@pytest.fixture
def repo():
    return ParsedMatchesRepo()

@pytest.mark.skip(reason="We'll fix this later.")
async def test_get_per_player_data_success(repo, async_session):
    await repo.create_parsed_match(MATCH_ID, SCHEMA_VERSION, RAW_GZIP, 20, PER_PLAYER_DATA, ETAG, async_session)
    result = await repo.get_per_player_data(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == PARSED_GAME_DATA

@pytest.mark.asyncio
async def test_get_per_player_data_not_found(repo, async_session):
    result = await repo.get_per_player_data(2, 1, async_session)
    assert result is None

@pytest.mark.skip(reason="No update functionality yet. To be implemented later.")
async def test_create_parsed_match_update(repo, async_session):
    await repo.create_parsed_match(MATCH_ID, SCHEMA_VERSION, RAW_GZIP, 20, PER_PLAYER_DATA, ETAG, async_session)
    # Update create_parsed_match
    modified_players = [
        ParsedPlayer(entity_id="3", custom_player_id="13", name=PLAYER_ONE.name, steam_id_32=PLAYER_ONE.steam_id_32).model_dump(),
        PLAYER_TWO.model_dump(),
    ]
    modified_data = {"damage": DAMAGE_PER_SECOND, "players": modified_players, "positions": []}
    new_etag = "etag456"
    await repo.create_parsed_match(MATCH_ID, SCHEMA_VERSION, RAW_GZIP, 20, modified_data, new_etag, async_session)
    result = await repo.get_per_player_data(MATCH_ID, SCHEMA_VERSION, async_session)
    assert result == modified_data
