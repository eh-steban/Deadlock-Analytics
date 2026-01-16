export interface BossSnapshot {
  entity_index: number;
  custom_id: number;    // Entity type ID (21, 25, 26, 27, 28)
  boss_name_hash: number;
  team: number;
  lane: number;
  x: number;
  y: number;
  z: number;
  spawn_time_s: number;
  max_health: number;
  life_state_on_create: number;
  death_time_s: number | null;
  life_state_on_delete: number | null;
}

export interface ScaledBossSnapshot extends BossSnapshot {
  left: number;
  top: number;
}

// Per-second health timeline: object mapping custom_id (as string) -> current_health
type BossHealthWindow = Record<string, number>;

type BossHealthTimeline = BossHealthWindow[];

export interface BossData {
  snapshots: BossSnapshot[];
  health_timeline: BossHealthTimeline;
}
