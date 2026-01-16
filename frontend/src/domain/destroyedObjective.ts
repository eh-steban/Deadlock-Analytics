export interface DestroyedObjective {
  team: string; // team is an ID stored as a string in the format "0" or "1"
  team_objective_id: string;
  destroyed_time_s: number;
  creep_damage: number;
  creep_damage_mitigated: number;
  player_damage: number;
  player_damage_mitigated: number;
  first_damage_time_s: number;
}
