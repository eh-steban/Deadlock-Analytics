from sqlmodel import SQLModel
# NOTE: I'm trying to be pedantic about the usage of "game" vs "match" in our code.
# The only reason we're referring to a "game" here as a "match" is because
# that's the terminology used in the protos (and therefore the Deadlock API).
# However, in typical tournament play, a "match" consists of multiple "games".
# If you see MatchMetadata, that's a Deadlock API thing. Once we have support
# for tournament matches, there may be some naming overlap and adjustments may be needed.
from app.domain.boss import BossData
from app.domain.deadlock_api import MatchMetadata
from app.domain.player import (
    PlayerData,
    # PlayerInfo,
    NPC,
    PlayerGameData,
    Positions,
    ParsedAttackerVictimMap
)

class ParsedGameResponse(SQLModel):
    total_game_time_s: int
    game_start_time_s: int
    # Shape of damage data from parser:
    # Vec<HashMap<i32, HashMap<i32, Vec<DamageRecord>>>> (tick -> attacker -> victim -> Vec<DamageRecord>)
    # The parser puts i32 values as keys into our json, but they get converted to strings in Python
    # when parsed from JSON. So we use str keys here.
    #
    damage: list[ParsedAttackerVictimMap]
    players_data: list[PlayerData]
    # players: list[PlayerInfo]
    positions: Positions
    bosses: BossData

# TODO: Created a temporary ParsedPlayer class to make this happy
# Might change this later
class TransformedGameData(SQLModel):
    total_game_time_s: int
    game_start_time_s: int
    players_data: list[PlayerData]
    # players: list[PlayerInfo]
    per_player_data: dict[str, PlayerGameData]
    bosses: BossData

class GameAnalysis(SQLModel):
    match_metadata: MatchMetadata
    parsed_game_data: TransformedGameData
