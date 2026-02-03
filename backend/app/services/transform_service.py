from app.domain.match_analysis import (
    ParsedMatchResponse,
    PlayerMatchData,
    TransformedMatchData,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

class TransformService:
    @staticmethod
    def to_match_data(parsed_match: ParsedMatchResponse) -> TransformedMatchData:
        match_data = TransformedMatchData(
            total_match_time_s=parsed_match.total_match_time_s,
            match_start_time_s=parsed_match.match_start_time_s,
            players_data=parsed_match.players_data,
            per_player_data={},
            bosses=parsed_match.bosses,
            creep_waves=parsed_match.creep_waves,
        )

        for player in parsed_match.players_data:
            match_data.per_player_data[player.custom_id] = PlayerMatchData.model_construct(
                positions=[], damage=[]
            )

        for i in range(0, (parsed_match.total_match_time_s - parsed_match.match_start_time_s)):
            for player_position in getattr(parsed_match, "positions", [])[i]:
                custom_id = player_position.custom_id

                is_human_player = int(custom_id) < 20
                if is_human_player:
                    match_data.per_player_data[str(custom_id)].positions.append(player_position)

            for player in getattr(parsed_match, "players_data", []):
                custom_id = player.custom_id

                damage = getattr(parsed_match, "damage", [])[i]
                damage_by_player = damage.get(custom_id, None)
                if damage_by_player:
                    match_data.per_player_data[custom_id].damage.append(
                        damage[custom_id]
                    )
                else:
                    match_data.per_player_data[custom_id].damage.append({})

        return match_data
