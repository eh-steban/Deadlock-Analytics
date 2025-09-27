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

DamageWindow = dict[str, list[DamageRecord]]
Damage = list[Optional[DamageWindow]]
ParsedVictimDamage = DamageWindow
ParsedAttackerVictimMap = dict[str, ParsedVictimDamage]

class PlayerPosition(SQLModel):
    player_id: str
    x: float
    y: float
    z: float

PositionWindow = list[Optional[PlayerPosition]]
Positions = list[PositionWindow]

class ParsedMatchResponse(SQLModel):
    seconds: int
    # Shape of damage data from parser:
    # Vec<HashMap<i32, HashMap<i32, Vec<DamageRecord>>>> (tick -> attacker -> victim -> Vec<DamageRecord>)
    # The parser puts i32 values as keys into our json, but they get converted to strings in Python
    # when parsed from JSON. So we use str keys here.
    #
    damage: list[ParsedAttackerVictimMap]
    players: list[ParsedPlayer]
    positions: Positions

class PlayerData(SQLModel):
    positions: PositionWindow
    damage: Damage

# TODO: Created a temporary ParsedPlayer class to make this happy
# Might change this later
class ParsedGameData(SQLModel):
    players: list[ParsedPlayer]
    per_player_data: dict[str, PlayerData]

class MatchAnalysis(SQLModel):
    match_metadata: MatchMetadata
    parsed_game_data: ParsedGameData
    players: list[Player]
    npcs: dict[str, NPC]
