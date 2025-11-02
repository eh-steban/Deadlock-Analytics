import { MatchMetadata } from "./MatchMetadata";
import { ParsedPlayer, PlayerGameData } from "./Player";

// Parsed game data (aggregated by player, per backend ParsedGameData)
export interface ParsedGameData {
  total_game_time_s: number;
  game_start_time_s: number;
  players_data: ParsedPlayer[];
  per_player_data: Record<string, PlayerGameData>; // key = player_id
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
type AllPlayerBounds = Readonly<{
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}>;

export const WORLD_BOUNDS: AllPlayerBounds = Object.freeze({
  xMin: MINIMAP_MIN,
  xMax: MINIMAP_MAX,
  yMin: MINIMAP_MIN,
  yMax: MINIMAP_MAX,
});
