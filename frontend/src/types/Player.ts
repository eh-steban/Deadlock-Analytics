export interface PlayerInfo {
  account_id: number;
  player_slot: number;
  team: number;
  hero_id: number;
}

export interface PlayerPathState {
  player_slot: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  x_pos: number[];
  y_pos: number[];
  health: number[];
  move_type: number[];
  combat_type: number[];
}

export interface Player {
  entity_id: number;
  custom_id: number;
  name: string;
  steam_id_32: number;
  player_info: PlayerInfo;
  path_state: PlayerPathState;
}

export interface NPC {
  entity_id: number;
  name: string;
}