from typing import Optional
from sqlmodel import SQLModel
from app.domain.deadlock_api import MatchMetadata
from app.domain.player import Player, ParsedPlayer, NPC

class DamageRecord(SQLModel):
    ability_id: Optional[int] = None
    attacker_class: Optional[int] = None
    citadel_type: Optional[int] = None
    damage: Optional[int] = None
    type: Optional[int] = None
    victim_class: Optional[int] = None

DamageWindow = dict[int, dict[int, list[DamageRecord]]]
DamagePerTick = list[DamageWindow]

# TODO: Created a temporary ParsedPlayer class to make this happy
# Might change this later
class ParsedGameData(SQLModel):
    damage_per_tick: DamagePerTick
    players: list[ParsedPlayer]
    entity_id_to_custom_player_id: dict[str, int]

class MatchAnalysis(SQLModel):
    match_metadata: MatchMetadata
    parsed_game_data: ParsedGameData
    players: list[Player]
    npcs: list[NPC]
