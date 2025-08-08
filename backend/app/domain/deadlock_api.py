from typing import Optional, Any
from sqlmodel import SQLModel
from app.domain.player import PlayerInfo, PlayerPathState

from typing import Optional
from sqlmodel import SQLModel
from app.domain.player import PlayerInfo, PlayerPathState

class MatchPaths(SQLModel):
    x_resolution: int
    y_resolution: int
    paths: list[PlayerPathState]

class MatchInfoFields(SQLModel):
    duration_s: int
    match_outcome: int
    winning_team: int
    players: list[PlayerInfo]
    start_time: int
    match_id: int
    legacy_objectives_mask: Any
    game_mode: int
    match_mode: int
    objectives: list[dict[str, Any]]
    match_paths: MatchPaths
    damage_matrix: dict[str, Any]
    match_pauses: list
    customer_user_stats: Optional[dict[str, Any]] = None
    watched_death_replays: list
    objectives_mark_team0: Optional[dict[str, Any]] = None
    objectives_mark_team1: Optional[dict[str, Any]] = None
    mid_boss: list[dict[str, Any]]
    is_high_skill_range_parties: bool
    low_pri_pool: bool
    new_player_pool: bool
    average_badge_team0: int
    average_badge_team1: int
    game_mode_version: int

class MatchMetadata(SQLModel):
    match_info: MatchInfoFields

class MatchSummary(SQLModel):
    account_id: int
    match_id: int
    hero_id: int
    hero_level: int
    start_time: int
    game_mode: int
    match_mode: int
    player_team: int
    player_kills: int
    player_deaths: int
    player_assists: int
    denies: int
    net_worth: int
    last_hits: int
    team_abandoned: Optional[bool] = None
    abandoned_time_s: Optional[int] = None
    match_duration_s: int
    match_result: int
    objectives_mask_team0: int
    objectives_mask_team1: int
