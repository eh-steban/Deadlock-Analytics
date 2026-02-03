// Lane pressure types for map control tracking

export interface LanePressureSnapshot {
  pressure: number; // 0-1 value (0 = own base, 1 = enemy base)
  team: number; // Team (2 = Amber, 3 = Sapphire)
  attributed_players: number[]; // Player custom_ids within proximity
  wave_x: number; // Wave centroid X position
  wave_y: number; // Wave centroid Y position
  wave_count: number; // Number of creeps in the wave
}

// Key format: "{lane}_{team}" (e.g., "1_2" for lane 1, team 2/Amber)
// Value: per-second snapshots (null if no wave that second)
export interface LanePressureData {
  pressure: Record<string, (LanePressureSnapshot | null)[]>;
}
