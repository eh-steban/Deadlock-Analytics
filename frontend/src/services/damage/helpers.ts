import { ParsedPlayer } from '../../types/Player';
import { BossSnapshot } from '../../types/Boss';

interface EntityMaps {
  playerMap: Map<string, ParsedPlayer>;
  bossMap: Map<number, BossSnapshot>;
}

/**
 * Create lookup maps for players and bosses
 * bossMap uses entity_index as key (unique per entity instance)
 */
export function createEntityMaps(
  players: ParsedPlayer[],
  bossSnapshots: BossSnapshot[]
): EntityMaps {
  const playerMap = new Map<string, ParsedPlayer>();
  players.forEach((p) => playerMap.set(p.custom_id, p));

  const bossMap = new Map<number, BossSnapshot>();
  bossSnapshots.forEach((boss) => bossMap.set(boss.entity_index, boss));

  return { playerMap, bossMap };
}

export function getBossUniqueKey(boss: BossSnapshot): string {
  return `${boss.team}_${boss.lane}_${boss.custom_id}_${boss.entity_index}`;
}

export function sumDamageRecords(
  damageRecords: Array<{ damage?: number }>
): number {
  return damageRecords.reduce((sum, record) => sum + (record.damage || 0), 0);
}

// Map custom_id to human-readable boss type names
const BOSS_TYPE_NAMES: Record<number, string> = {
  21: 'Guardian',
  25: 'Shrine',
  26: 'Walker',
  27: 'Base Guardian',
  28: 'Patron',
};

export function getBossDisplayName(boss: BossSnapshot): string {
  const typeName = BOSS_TYPE_NAMES[boss.custom_id] || `Boss ${boss.custom_id}`;
  const laneStr = boss.lane > 0 ? ` - Lane ${boss.lane}` : '';
  return `${typeName}${laneStr} #${boss.entity_index}`;
}

/**
 * Sort targets by damage (descending) and calculate percentages
 */
export function sortAndCalculatePercentages<
  T extends { damage: number; percentage?: number }
>(targets: T[], totalDamage: number): void {
  targets.sort((a, b) => b.damage - a.damage);
  targets.forEach((target) => {
    target.percentage =
      totalDamage > 0 ? (target.damage / totalDamage) * 100 : 0;
  });
}
