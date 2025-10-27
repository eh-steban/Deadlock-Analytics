import logging
from app.domain.match_analysis import (
    ParsedGameResponse,
    PlayerGameData,
    TransformedGameData,
)

logger = logging.getLogger(__name__)

class TransformService:
    @staticmethod
    def to_game_data(parsed_game: ParsedGameResponse) -> TransformedGameData:
        game_data = TransformedGameData(
            total_game_time_s=parsed_game.total_game_time_s,
            game_start_time_s=parsed_game.game_start_time_s,
            players_data=parsed_game.players_data,
            per_player_data={},
        )

        for player in parsed_game.players_data:
            game_data.per_player_data[player.custom_id] = PlayerGameData.model_construct(
                positions=[], damage=[]
            )

        for i in range(0, (parsed_game.total_game_time_s - parsed_game.game_start_time_s)):
            for player_position in getattr(parsed_game, "positions", [])[i]:
                custom_id = player_position.custom_id

                is_human_player = int(custom_id) < 20
                if is_human_player:
                    game_data.per_player_data[str(custom_id)].positions.append(player_position)

            for player in getattr(parsed_game, "players_data", []):
                custom_id = player.custom_id

                damage = getattr(parsed_game, "damage", [])[i]
                damage_by_player = damage.get(custom_id, None)
                if damage_by_player:
                    game_data.per_player_data[custom_id].damage.append(
                        damage[custom_id]
                    )
                else:
                    game_data.per_player_data[custom_id].damage.append({})

        return game_data
