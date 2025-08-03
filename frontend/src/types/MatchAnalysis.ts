import { MatchMetadata } from './MatchMetadata';

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

type DamageDone = DamageWindow[];

export interface Player {
  id: number;
  name: string;
  steam_id_32: number;
}

interface ParsedGameData {
  damage_done: DamageDone;
  players: Player[];
  entity_id_to_custom_player_id: { [entityId: string]: string };
}

export interface MatchAnalysisResponse {
  match_metadata: MatchMetadata;
  parsed_game_data: ParsedGameData;
}