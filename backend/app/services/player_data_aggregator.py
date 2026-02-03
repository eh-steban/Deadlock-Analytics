from app.domain.match_analysis import ParsedMatchResponse, PlayerMatchData
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Custom IDs below this threshold indicate human players
HUMAN_PLAYER_ID_THRESHOLD = 20


class PlayerDataAggregator:
    """Aggregate per-player positions and damage from parsed match data."""

    @staticmethod
    def initialize_player_data(parsed_match: ParsedMatchResponse) -> dict[str, PlayerMatchData]:
        """Initialize empty per-player data structures."""
        return {
            player.custom_id: PlayerMatchData.model_construct(positions=[], damage=[])
            for player in parsed_match.players_data
        }

    @staticmethod
    def aggregate_all(
        parsed_match: ParsedMatchResponse,
        per_player_data: dict[str, PlayerMatchData],
    ) -> None:
        """
        Aggregate both positions and damage in a single timeline pass.

        Performance: Single pass through match timeline (N ticks) is 2x faster
        than separate position and damage passes (2N ticks).

        Args:
            parsed_match: Parser output with positions and damage data
            per_player_data: Pre-initialized dict to populate (mutated in-place)
        """
        match_duration = parsed_match.total_match_time_s - parsed_match.match_start_time_s

        for tick in range(match_duration):
            # Aggregate positions for human players
            for player_position in parsed_match.positions[tick]:
                custom_id = player_position.custom_id

                # Only track human players (NPCs have IDs >= 20)
                if int(custom_id) < HUMAN_PLAYER_ID_THRESHOLD:
                    per_player_data[str(custom_id)].positions.append(player_position)

            # Aggregate damage for all players (same tick)
            damage_at_tick = parsed_match.damage[tick]

            for player in parsed_match.players_data:
                custom_id = player.custom_id
                damage_by_player = damage_at_tick.get(custom_id, None)

                if damage_by_player:
                    per_player_data[custom_id].damage.append(damage_by_player)
                else:
                    per_player_data[custom_id].damage.append({})
