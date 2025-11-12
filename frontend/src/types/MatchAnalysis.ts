import { MatchMetadata } from "./MatchMetadata";
import { ParsedPlayer, PlayerGameData } from "./Player";
import { BossData } from "./Boss";

// Parsed game data (aggregated by player, per backend ParsedGameData)
export interface ParsedGameData {
  total_game_time_s: number;
  game_start_time_s: number;
  players_data: ParsedPlayer[];
  per_player_data: Record<string, PlayerGameData>; // key = player_id
  bosses: BossData;
}

// Full match anal\ysis response (backend MatchAnalysis)
// Note: npc keys are strings (backend returns dict[str, NPC])
export interface GameAnalysisResponse {
  match_metadata: MatchMetadata;
  parsed_game_data: ParsedGameData;
}

// *****NOTE******
// These values can be found in the parser under...
// m_pGameRules.m_vMinimapMins:Vector = [-10752.0, -10752.0, 0.0]
// m_pGameRules.m_vMinimapMaxs:Vector = [10752.0, 10752.0, 0.0]
// After checking 2 games, the values seem to be constant.
// The parser docs show a different value, so I'm wondering if they
// ever change. For now, we'll hardcode them.
const MINIMAP_MIN = -10752;
const MINIMAP_MAX = 10752;

export const WORLD_BOUNDS = Object.freeze({
  xMin: MINIMAP_MIN,
  xMax: MINIMAP_MAX,
  yMin: MINIMAP_MIN,
  yMax: MINIMAP_MAX,
} as const);

export const defaultMatchAnalysis: GameAnalysisResponse = {
  // NOTE: match references here are because it's coming from the Deadlock API.
  // Parsed game data refers to these as "games"
  match_metadata: {
    match_info: {
      duration_s: 0,
      match_outcome: 0,
      winning_team: 0,
      players: [],
      start_time: 0,
      match_id: 0,
      legacy_objectives_mask: null,
      game_mode: 0,
      match_mode: 0,
      objectives: [],
      damage_matrix: {
        sample_time_s: [],
        source_details: {
          stat_type: [],
          source_name: [],
        },
        damage_dealers: [],
      },
      match_pauses: [],
      customer_user_stats: undefined,
      watched_death_replays: [],
      objectives_mark_team0: undefined,
      objectives_mark_team1: undefined,
      mid_boss: [],
      is_high_skill_range_parties: false,
      low_pri_pool: false,
      new_player_pool: false,
      average_badge_team0: 0,
      average_badge_team1: 0,
      game_mode_version: 0,
    },
  },
  parsed_game_data: {
    total_game_time_s: 0,
    game_start_time_s: 0,
    players_data: [],
    per_player_data: {},
    bosses: {
      snapshots: [],
      health_timeline: [],
    },
  },
};
