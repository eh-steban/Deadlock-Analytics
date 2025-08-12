from app.domain.player import NPC, Player, PlayerInfo, PlayerPathState, ParsedPlayer
from app.domain.player_analytics import PlayerAnalytics

class PlayerService:
    @classmethod
    async def map_player_data(
        cls,
        parsed_players: list[ParsedPlayer],
        player_info_list: list[PlayerInfo],
        player_paths_list: list[PlayerPathState]
    ) -> tuple[list[Player], dict[int, NPC]]:
        players, npcs = await PlayerAnalytics().map_entities(parsed_players, player_info_list, player_paths_list)
        return players, npcs
