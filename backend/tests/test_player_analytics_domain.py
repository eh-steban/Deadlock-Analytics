import pytest
import pytest_asyncio
from app.domain.player_analytics import PlayerAnalytics
from app.domain.player import Player, PlayerInfo, PlayerPathState, ParsedPlayer, NPC

@pytest_asyncio.fixture
async def sample_player_info_list():
    return [
        PlayerInfo(account_id=1234567, player_slot=0, team=1, hero_id=101),
        PlayerInfo(account_id=2234567, player_slot=1, team=1, hero_id=102),
        PlayerInfo(account_id=3234567, player_slot=2, team=2, hero_id=103),
        PlayerInfo(account_id=4234567, player_slot=3, team=2, hero_id=104),
    ]

@pytest_asyncio.fixture
async def sample_player_paths_list():
    return [
        PlayerPathState(
            player_slot=0,
            x_min=1, y_min=1, x_max=10, y_max=10,
            x_pos=[1,2,3], y_pos=[3,2,1],
            health=[100.0, 90.0, 80.0],
            move_type=[0,1,2], combat_type=[1,1,1]
        ),
        PlayerPathState(
            player_slot=1,
            x_min=1, y_min=1, x_max=10, y_max=10,
            x_pos=[4,5,6], y_pos=[6,5,4],
            health=[95.0, 85.0, 75.0],
            move_type=[1,2,3], combat_type=[2,2,2]
        ),
        PlayerPathState(
            player_slot=2,
            x_min=1, y_min=1, x_max=10, y_max=10,
            x_pos=[7,8,9], y_pos=[9,8,7],
            health=[100.0, 90.0, 80.0],
            move_type=[0,1,2], combat_type=[1,1,1]
        ),
        PlayerPathState(
            player_slot=3,
            x_min=1, y_min=1, x_max=10, y_max=10,
            x_pos=[0,1,2], y_pos=[2,1,0],
            health=[95.0, 85.0, 75.0],
            move_type=[1,2,3], combat_type=[2,2,2]
        ),
    ]

@pytest_asyncio.fixture
async def sample_entity_to_custom_id_list():
    return {
        "100": 10,
        "101": 11,
        "102": 12,
    }

@pytest_asyncio.fixture
async def sample_parsed_players():
    return [
        ParsedPlayer(entity_id=100, name="Alice", steam_id_32=1234567),
        ParsedPlayer(entity_id=101, name="Bob", steam_id_32=2234567),
        ParsedPlayer(entity_id=102, name="Eve", steam_id_32=0),  # NPC
    ]

@pytest.mark.asyncio
async def test_map_entities_success(sample_parsed_players, sample_entity_to_custom_id_list, sample_player_info_list, sample_player_paths_list):
    players, npcs = await PlayerAnalytics().map_entities(
        sample_parsed_players,
        sample_entity_to_custom_id_list,
        sample_player_info_list,
        sample_player_paths_list
    )
    assert isinstance(players, list)
    assert isinstance(npcs, list)
    assert all(isinstance(p, Player) for p in players)
    assert all(isinstance(n, NPC) for n in npcs)

    for p in players:
        assert hasattr(p, 'entity_id')
        assert hasattr(p, 'name')
        assert hasattr(p, 'steam_id_32')
        assert hasattr(p, 'player_info')
        assert hasattr(p, 'path_state')
        assert isinstance(p.player_info, PlayerInfo)
        assert isinstance(p.path_state, PlayerPathState)

    for n in npcs:
        assert hasattr(n, 'entity_id')
        assert hasattr(n, 'name')
