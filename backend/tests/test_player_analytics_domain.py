import pytest
import pytest_asyncio
from app.domain.player_analytics import PlayerAnalytics
from app.domain.player import Player, PlayerInfo, ParsedPlayer

@pytest_asyncio.fixture
async def sample_player_info_list():
    return [
        PlayerInfo(account_id=1234567, player_slot=0, team=1, hero_id=101),
        PlayerInfo(account_id=2234567, player_slot=1, team=1, hero_id=102),
        PlayerInfo(account_id=3234567, player_slot=2, team=2, hero_id=103),
        PlayerInfo(account_id=4234567, player_slot=3, team=2, hero_id=104),
    ]

@pytest_asyncio.fixture
async def sample_parsed_players():
    return [
        ParsedPlayer(entity_id="1", custom_player_id="11", name="Alice", steam_id_32=1234567),
        ParsedPlayer(entity_id="2", custom_player_id="12", name="Bob", steam_id_32=2234567),
    ]

@pytest.mark.asyncio
async def test_map_entities_success(sample_parsed_players, sample_player_info_list):
    players, npcs = await PlayerAnalytics().map_entities(
        sample_parsed_players,
        sample_player_info_list,
    )
    assert isinstance(players, list)
    assert isinstance(npcs, dict)
    assert all(isinstance(p, Player) for p in players)

    for p in players:
        assert hasattr(p, 'entity_id')
        assert hasattr(p, 'name')
        assert hasattr(p, 'steam_id_32')
        assert hasattr(p, 'player_info')
        assert isinstance(p.player_info, PlayerInfo)
