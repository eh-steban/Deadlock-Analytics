from app.domain.player import Player, PlayerInfo, PlayerPathState, ParsedPlayer, NPC


class PlayerAnalytics:
    async def map_entities(
        self,
        parsed_players: list[ParsedPlayer],
        player_info_list: list[PlayerInfo],
    ) -> tuple[list[Player], dict[str, NPC]]:
        """
        Map player data for all players with steam_id_32 != 0.
        Returns a list of Player objects with all data combined and
        a list of NPC objects for players with steam_id_32 == 0.
        """
        player_info_by_account_id = {p.account_id: p for p in player_info_list}
        # path_by_slot = {p.player_slot: p for p in player_paths_list}
        players = []
        npcs = {
            "20": NPC(entity_id="20", name="<CNPC_Trooper>"),
            "21": NPC(entity_id="21", name="<CNPC_TrooperBoss>"),
            "22": NPC(entity_id="22", name="<CNPC_TrooperNeutral>"),
            "23": NPC(entity_id="23", name="<CNPC_MidBoss>"),
            "24": NPC(entity_id="24", name="<CItemXP>"),
            "25": NPC(entity_id="25", name="<CCitadel_Destroyable_Building>"),
            "26": NPC(entity_id="26", name="<CNPC_Boss_Tier2>"),
            "27": NPC(entity_id="27", name="<CNPC_TrooperBarrackBoss>"),
            "28": NPC(entity_id="28", name="<CNPC_Boss_Tier3>"),
            "29": NPC(entity_id="29", name="*****FIXME: Not sure what entity this is*****"),
            "30": NPC(entity_id="30", name="*****FIXME: Not sure what entity this is*****"),
            "29": NPC(entity_id="31", name="*****FIXME: Not sure what entity this is*****"),
            "31": NPC(entity_id="32", name="*****FIXME: Not sure what entity this is*****"),
            "28": NPC(entity_id="33", name="*****FIXME: Not sure what entity this is*****"),
            "23": NPC(entity_id="34", name="*****FIXME: Not sure what entity this is*****"),
            "8": NPC(entity_id="35", name="*****FIXME: Not sure what entity this is*****"),
        }

        for parsed in parsed_players:
            # Map the `Player` to the `PlayerInfo` by `steam_id_32` and `account_id` respectively
            player_info = player_info_by_account_id.get(
                parsed.steam_id_32,
                PlayerInfo(
                    account_id=0,
                    player_slot=0,
                    team=0,
                    hero_id=0,
                ),
            )
            # # Map the `PlayerInfo` to `PlayerPathState` by `player_slot`
            # path_state = path_by_slot.get(player_info.player_slot, PlayerPathState(
            #     player_slot=player_info.player_slot,
            #     x_min=0, y_min=0, x_max=0, y_max=0,
            #     x_pos=[],
            #     y_pos=[],
            #     health=[],
            #     move_type=[],
            #     combat_type=[]
            # ))
            # Map `Player` to `PlayerInfo`
            players.append(
                Player(
                    entity_id=parsed.entity_id,
                    name=parsed.name,
                    steam_id_32=parsed.steam_id_32,
                    player_info=player_info,
                    # path_state=path_state
                )
            )

        return players, npcs
