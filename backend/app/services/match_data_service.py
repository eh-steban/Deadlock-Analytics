from app.domain.match_analysis import (
    ParsedMatchResponse,
    TransformedMatchData,
)
from app.services.lane_pressure_service import LanePressureCalculator
from app.services.players_data_service import PlayersDataService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MatchDataService:
    """Transform parsed match data into final domain model."""

    @staticmethod
    def transform(parsed_match: ParsedMatchResponse) -> TransformedMatchData:
        """
        Transform ParsedMatchResponse into TransformedMatchData.

        Assembles complete match data including:
        - Per-player position data
        - Per-player damage data
        - Creep wave position data (per lane/team)
        - Lane pressure metrics (derived from creep wave positions)

        Args:
            parsed_match: Parser output with raw position, damage, and creep data

        Returns:
            Complete TransformedMatchData ready for storage and API response
        """
        # Derive lane pressure from creep wave positions
        lane_pressure = LanePressureCalculator.process_creep_waves(
            parsed_match.creep_waves,
            parsed_match.positions,
        )

        # Aggregate per-player position and damage data
        per_player_data = PlayersDataService.aggregate(parsed_match)

        # Assemble final structure
        return TransformedMatchData(
            total_match_time_s=parsed_match.total_match_time_s,
            match_start_time_s=parsed_match.match_start_time_s,
            players_data=parsed_match.players_data,
            per_player_data=per_player_data,
            bosses=parsed_match.bosses,
            creep_waves=parsed_match.creep_waves,  # Creep position data
            lane_pressure=lane_pressure,  # Derived lane pressure metrics
        )
