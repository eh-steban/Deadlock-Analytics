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

// Map boss_name_hash to human-readable boss type names
// Hash values are fxhash of entity class names in the game
// These hash values come from the parser
const BOSS_NAME_HASH_MAP: Record<string, string> = {
  '12946736302082734000': 'Guardian',        // CNPC_TrooperBoss
  '1942975293714691300': 'Walker',           // CNPC_Boss_Tier2
  '13296896848213166000': 'Base Guardian',   // CNPC_TrooperBarrackBoss
  '8292725763874089000': 'Shrine',           // CCitadel_Destroyable_Building
  '7814756300278694000': 'Patron',           // CNPC_Boss_Tier3
};

export function getBossDisplayName(boss: BossSnapshot): string {
  const hashKey = String(boss.boss_name_hash);
  const typeName = BOSS_NAME_HASH_MAP[hashKey] || `Boss #${boss.boss_name_hash}`;
  const laneStr = boss.lane > 0 ? ` - Lane ${boss.lane}` : '';
  let bossName = `${typeName}${laneStr}`;
  if (typeName == 'Base Guardian' || typeName == 'Shrine') {
    bossName = bossName + ` (${boss.entity_index})`;
  }
  return bossName;
}
