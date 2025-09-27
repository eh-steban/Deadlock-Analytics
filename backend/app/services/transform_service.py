import logging
from app.domain.match_analysis import (
    ParsedMatchResponse,
    PlayerData,
    ParsedGameData,
)

logger = logging.getLogger(__name__)

class TransformService:
    @staticmethod
    def to_per_player_data(parsed_match: ParsedMatchResponse) -> ParsedGameData:
        data = ParsedGameData(
            players=parsed_match.players,
            per_player_data={},
        )

        for player in parsed_match.players:
            data.per_player_data[str(player.custom_player_id)] = PlayerData.model_construct(
                positions=[], damage=[]
            )

        for i in range(0, parsed_match.seconds):
            for player_position in getattr(parsed_match, "positions", [])[i]:
                custom_player_id = player_position.player_id

                is_human_player = int(custom_player_id) < 20
                if is_human_player:
                    data.per_player_data[str(custom_player_id)].positions.append(player_position)

            for player in getattr(parsed_match, "players", []):
                custom_player_id = player.custom_player_id

                damage = getattr(parsed_match, "damage", [])[i]
                damage_by_player = damage.get(custom_player_id, None)
                if damage_by_player:
                    data.per_player_data[custom_player_id].damage.append(
                        damage[custom_player_id]
                    )
                else:
                    data.per_player_data[custom_player_id].damage.append({})

        return data
