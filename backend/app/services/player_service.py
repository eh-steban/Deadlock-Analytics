# from app.domain.player import NPC, Player
# from app.domain.player_analytics import PlayerAnalytics


# class PlayerService:
#     @classmethod
#     async def map_player_data(
#         cls,
#         player_info_list: list[Player],
#     ) -> tuple[list[Player], dict[str, NPC]]:
#         players, npcs = await PlayerAnalytics().map_entities(
#             player_info_list
#         )
#         return players, npcs
