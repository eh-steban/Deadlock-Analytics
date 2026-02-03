// Creep wave tracking types for lane pressure analysis

export interface CreepWaveSnapshot {
  x: number; // Centroid X position
  y: number; // Centroid Y position
  count: number; // Number of creeps in the wave
  team: number; // Team (2 = Amber, 3 = Sapphire)
}

// Key format: "{lane}_{team}" (e.g., "1_2" for lane 1, team 2/Amber)
// Value: per-second snapshots (null if no wave that second)
export interface CreepWaveData {
  waves: Record<string, (CreepWaveSnapshot | null)[]>;
}
