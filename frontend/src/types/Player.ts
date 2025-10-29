export interface DRTypeAggregateBySec {
  agg_damage: number;
  agg_pre_damage: number;
  type: number;
  citadel_type: number;
  entindex_inflictor: number;
  entindex_ability: number;
  agg_damage_absorbed: number;
  victim_health_max: number;
  victim_health_new: number;
  flags: number;
  ability_id: number;
  attacker_class: number;
  victim_class: number;
  victim_shield_max: number;
  agg_victim_shield_new: number;
  agg_hits: number;
  agg_health_lost: number;
}

export interface DamageRecord {
  damage?: number;
  pre_damage?: number;
  type?: number;
  citadel_type?: number;
  entindex_inflictor?: number;
  entindex_ability?: number;
  damage_absorbed?: number;
  victim_health_max?: number;
  victim_health_new?: number;
  flags?: number;
  ability_id?: number;
  attacker_class?: number;
  victim_class?: number;
  victim_shield_max?: number;
  victim_shield_new?: number;
  hits?: number;
  health_lost?: number;
}

// Comes from DeadlockAPI
// export interface PlayerPathState {
//   player_slot: number;
//   x_min: number;
//   y_min: number;
//   x_max: number;
//   y_max: number;
//   x_pos: number[];
//   y_pos: number[];
//   health: number[];
//   move_type: number[];
//   combat_type: number[];
// }

// victim_id -> DamageRecord[]
export type ParsedVictimDamage = Record<string, DamageRecord[]>;
/**
 * Damage timeline:
 * Index = tick (second). Each element is either:
 *  - ParsedVictimDamage (victim -> damage records)
 *  - null (no damage that tick)
 */
export type Damage = ParsedVictimDamage[];

// Comes from parser
export interface PlayerPosition {
  custom_id: string;
  x: number;
  y: number;
  z: number;
  is_npc: boolean;
}

// All positions for one tick (can contain nulls if a player absent that tick)
export type PositionWindow = PlayerPosition[];

// Comes from DeadlockAPI
export interface PlayerInfo {
  account_id: number;
  player_slot: number;
  team: number;
  hero_id: number;
}

// Comes from parser
export interface PlayerData {
  custom_id: string;
  entity_id: string;
  hero_id: number; // FIXME: ugly but needed for hero lookup
  lane: number;
  lobby_player_slot: number;
  name: string;
  steam_id_32: number;
  team: number;
  zipline_lane_color: number;
  hero: Hero; // FIXME: temporary, to hold hero data
  // player_info: PlayerInfo;
  // path_state: PlayerPathState;
}

// Per-player aggregated data (damage + positions windows)
export interface PlayerGameData {
  positions: PositionWindow;
  damage: Damage;
}

// Temporary ParsedPlayer type (extend if backend adds extra fields)
export interface ParsedPlayer extends PlayerData {
  // Add any additional parsed-only fields here if needed
}

export interface Hero {
  id: number;
  name: string;
  images: { [key: string]: string };
}

// Comes from parser
export interface NPC {
  entity_id: number;
  name: string;
}
