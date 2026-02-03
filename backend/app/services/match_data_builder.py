from app.domain.match_analysis import (
    ParsedMatchResponse,
    TransformedMatchData,
)
from app.services.lane_pressure_service import LanePressureCalculator
from app.services.player_data_aggregator import PlayerDataAggregator
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MatchDataBuilder:
    """Build TransformedMatchData from ParsedMatchResponse."""

    @staticmethod
    def build(parsed_match: ParsedMatchResponse) -> TransformedMatchData:
        """
        Build a complete TransformedMatchData instance from parser output.

        Coordinates domain services to:
        - Calculate lane pressure from creep waves
        - Aggregate per-player positional and damage data
        """
        # Calculate derived metrics
        lane_pressure = LanePressureCalculator.process_creep_waves(
            parsed_match.creep_waves,
            parsed_match.positions,
        )

        # Initialize per-player data structures
        per_player_data = PlayerDataAggregator.initialize_player_data(parsed_match)

        # Aggregate player-specific data (single pass for performance)
        PlayerDataAggregator.aggregate_all(parsed_match, per_player_data)

        # Assemble final structure
        return TransformedMatchData(
            total_match_time_s=parsed_match.total_match_time_s,
            match_start_time_s=parsed_match.match_start_time_s,
            players_data=parsed_match.players_data,
            per_player_data=per_player_data,
            bosses=parsed_match.bosses,
            creep_waves=parsed_match.creep_waves,
            lane_pressure=lane_pressure,
        )
