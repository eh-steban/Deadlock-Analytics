from app.domain.player import Player, PlayerInfo, PlayerPathState, ParsedPlayer, NPC

class PlayerAnalytics:
    async def map_entities(
        self,
        parsed_players: list[ParsedPlayer],
        entity_to_custom_id_list: dict[str, int],
        player_info_list: list[PlayerInfo],
        player_paths_list: list[PlayerPathState]
    ) -> tuple[list[Player], list[NPC]]:
        """
        Map player data for all players with steam_id_32 != 0.
        Returns a list of Player objects with all data combined and
        a list of NPC objects for players with steam_id_32 == 0.
        """
        player_info_by_account_id = {p.account_id: p for p in player_info_list}
        path_by_slot = {p.player_slot: p for p in player_paths_list}
        players = []
        npcs = []
        for parsed in parsed_players:
            if parsed.steam_id_32 == 0:
                npcs.append(NPC(
                    entity_id=parsed.entity_id,
                    name=parsed.name
                ))
            else:
                # Map the `Player` to the `PlayerInfo` by `steam_id_32` and `account_id` respectively
                player_info = player_info_by_account_id.get(parsed.steam_id_32, PlayerInfo(
                    account_id=0,
                    player_slot=0,
                    team=0,
                    hero_id=0,
                ))
                # Map the `PlayerInfo` to `PlayerPathState` by `player_slot`
                path_state = path_by_slot.get(player_info.player_slot, PlayerPathState(
                    player_slot=player_info.player_slot,
                    x_min=0, y_min=0, x_max=0, y_max=0,
                    x_pos=[],
                    y_pos=[],
                    health=[],
                    move_type=[],
                    combat_type=[]
                ))
                # Map `Player` to `PlayerInfo` and `PlayerPathState`
                players.append(Player(
                    entity_id=parsed.entity_id,
                    custom_id=entity_to_custom_id_list[str(parsed.entity_id)],
                    name=parsed.name,
                    steam_id_32=parsed.steam_id_32,
                    player_info=player_info,
                    path_state=path_state
                ))

        return players, npcs
