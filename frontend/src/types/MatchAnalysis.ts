import { MatchMetadata } from './MatchMetadata';
import { Player, NPC } from './Player';

export interface DamageRecord {
  damage: number;
  type: number;
  citadel_type: number;
  ability_id: number;
  attacker_class: number;
  victim_class: number;
}

type DamageWindow = {
  [attackerId: number]: {
    [victimId: number]: DamageRecord[];
  };
};

type DamagePerTick = DamageWindow[];

export interface ParsedGameData {
  damage_per_tick: DamagePerTick;
  players: Player[];
}

export interface MatchAnalysisResponse {
  match_metadata: MatchMetadata;
  parsed_game_data: ParsedGameData;
  players: Player[];
  npcs: { [key: number]: NPC };
}