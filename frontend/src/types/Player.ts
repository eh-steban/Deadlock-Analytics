export interface DamageRecord {
  ability_id?: number;
  attacker_class?: number;
  citadel_type?: number;
  damage?: number;
  type?: number;
  victim_class?: number;
}

interface TickDamageEvent {
  tick: number;
  attackerId: string;
  victimId: string;
  record: DamageRecord;
}

// type DamageWindow = {
//   [attackerId: number]: {
//     [victimId: number]: DamageRecord[];
//   };
// };

// type Damage = DamageWindow[];

// Comes from DeadlockAPI
export interface PlayerInfo {
  account_id: number;
  player_slot: number;
  team: number;
  hero_id: number;
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
 * attacker_id -> (victim_id -> DamageRecord[])
 * One entry per attacker for a single tick.
 */
export type ParsedAttackerVictimMap = Record<string, ParsedVictimDamage>;

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
// Timeline of position windows
// export type Positions = PositionWindow[];

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
