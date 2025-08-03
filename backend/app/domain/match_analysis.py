from typing import List, Dict, Optional
from sqlmodel import SQLModel
from app.domain.deadlock_api import MatchMetadata

class Player(SQLModel):
    id: int
    name: str
    steam_id_32: int

class DamageRecord(SQLModel):
    ability_id: Optional[int] = None
    attacker_class: Optional[int] = None
    citadel_type: Optional[int] = None
    damage: Optional[int] = None
    type: Optional[int] = None
    victim_class: Optional[int] = None

DamageWindow = Dict[int, Dict[int, List[DamageRecord]]]
DamageDone = List[DamageWindow]

class ParsedGameData(SQLModel):
    damage_done: DamageDone
    players: List[Player]
    entity_id_to_custom_player_id: Dict[int, int]

class MatchAnalysis(SQLModel):
    match_metadata: MatchMetadata
    parsed_game_data: ParsedGameData
