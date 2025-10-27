import { MatchMetadata } from "./MatchMetadata";
import {
  PlayerData,
  PlayerPosition,
  NPC,
  Damage,
  ParsedPlayer,
  PlayerGameData,
} from "./Player";

// Parsed game data (aggregated by player, per backend ParsedGameData)
export interface ParsedGameData {
  total_game_time_s: number;
  game_start_time_s: number;
  players_data: ParsedPlayer[];
  per_player_data: Record<string, PlayerGameData>; // key = player_id
}

// Full match analysis response (backend MatchAnalysis)
// Note: npc keys are strings (backend returns dict[str, NPC])
export interface GameAnalysisResponse {
  match_metadata: MatchMetadata;
  parsed_game_data: ParsedGameData;
  // players: Player[];
  // npcs: Record<string, NPC>;
}
