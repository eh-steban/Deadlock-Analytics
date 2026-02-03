"""Lane pressure domain models for map control tracking."""

from typing import Optional
from sqlmodel import SQLModel


class LanePressureSnapshot(SQLModel):
    """Snapshot of lane pressure at a given time.

    Pressure represents how far into enemy territory the wave has pushed.
    - 0.0 = wave at own base
    - 1.0 = wave at enemy base
    """

    pressure: float  # 0-1 value representing map pressure
    team: int  # Team (2 = Amber, 3 = Sapphire)
    attributed_players: list[int]  # Player custom_ids within proximity
    wave_x: float  # Wave centroid X position
    wave_y: float  # Wave centroid Y position
    wave_count: int  # Number of creeps in the wave


class LanePressureData(SQLModel):
    """Container for all lane pressure data.

    Key format: "{lane}_{team}" (e.g., "1_2" for lane 1, team 2/Amber)
    Value: per-second snapshots (None if no wave that second)
    """

    pressure: dict[str, list[Optional[LanePressureSnapshot]]]
