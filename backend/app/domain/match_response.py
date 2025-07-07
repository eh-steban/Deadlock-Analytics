from typing import Optional
from pydantic import BaseModel

class MatchResponse(BaseModel):
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
