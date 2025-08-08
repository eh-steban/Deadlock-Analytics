import { DestroyedObjective } from './DestroyedObjective';
import { PlayerPathState, PlayerInfo } from './Player';

export interface MatchMetadata {
  match_info: MatchInfoFields;
}

export interface MatchInfoFields {
  duration_s: number;
  match_outcome: number;
  winning_team: number;
  players: Array<PlayerInfo>;
  start_time: number;
  match_id: number;
  legacy_objectives_mask: any;
  game_mode: number;
  match_mode: number;
  objectives: Array<DestroyedObjective>;
  match_paths: {
    x_resolution: number;
    y_resolution: number;
    paths: Array<PlayerPathState>;
  };
  damage_matrix: {
    sample_time_s: number[];
    source_details: {
      stat_type: number[];
      source_name: string[];
    };
    damage_dealers: Array<{
      dealer_player_slot?: number;
      damage_sources: Array<Array<{
        source_details_index: number;
        damage_to_players: Array<{
          target_player_slot?: number;
          damage: Array<number>;
        }>;
      }>>;
    }>;
  };
  match_pauses: any[];
  customer_user_stats?: Record<string, any>;
  watched_death_replays: any[];
  objectives_mark_team0?: Record<string, any>;
  objectives_mark_team1?: Record<string, any>;
  mid_boss: Array<Record<string, any>>;
  is_high_skill_range_parties: boolean;
  low_pri_pool: boolean;
  new_player_pool: boolean;
  average_badge_team0: number;
  average_badge_team1: number;
  game_mode_version: number;
}
