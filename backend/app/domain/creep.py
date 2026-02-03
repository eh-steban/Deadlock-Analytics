"""Creep wave domain models for lane pressure tracking."""

from typing import Optional
from sqlmodel import SQLModel


class CreepWaveSnapshot(SQLModel):
    """Snapshot of a creep wave at a given time."""

    x: float  # Centroid X position
    y: float  # Centroid Y position
    count: int  # Number of creeps in the wave
    team: int  # Team (2 = Amber, 3 = Sapphire)


class CreepWaveData(SQLModel):
    """Container for all creep wave data.

    Key format: "{lane}_{team}" (e.g., "1_2" for lane 1, team 2/Amber)
    Value: per-second snapshots (None if no wave that second)
    """

    waves: dict[str, list[Optional[CreepWaveSnapshot]]]
