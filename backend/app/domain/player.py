from typing import Any
from sqlmodel import SQLModel

# PlayerPathState is pulled from Deadlock API (match_metadata call)
# player_slot is the slot in the match, starting from 0.
class PlayerPathState(SQLModel):
    player_slot: int
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    x_pos: list[int]
    y_pos: list[int]
    health: list[float]
    move_type: list[int]
    combat_type: list[int]

# PlayerInfo is pulled from Deadlock API (match_metadata call) and account_id
# is a 32-bit steam_id. The regular/web steam_id is 64-bit.
# player_slot is the slot in the match, starting from 0.
class PlayerInfo(SQLModel):
    account_id: int
    player_slot: int
    team: int
    hero_id: int

class ParsedPlayer(SQLModel):
    entity_id: int
    name: str
    steam_id_32: int

class NPC(SQLModel):
    entity_id: int
    name: str

class Player(SQLModel):
    entity_id: int
    name: str
    steam_id_32: int
    player_info: PlayerInfo
    path_state: PlayerPathState
