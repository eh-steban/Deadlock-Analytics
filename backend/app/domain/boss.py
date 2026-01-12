from sqlmodel import SQLModel
from typing import Optional

class BossSnapshot(SQLModel):
    custom_id: int
    boss_name_hash: int
    team: int
    lane: int
    x: float
    y: float
    z: float
    spawn_time_s: int
    max_health: int
    life_state_on_create: int
    death_time_s: Optional[int] = None
    life_state_on_delete: Optional[int] = None

BossHealthWindow = dict[str, int]
BossHealthTimeline = list[BossHealthWindow]

class BossData(SQLModel):
    snapshots: list[BossSnapshot]
    health_timeline: BossHealthTimeline
