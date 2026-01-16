import { ParsedPlayer } from '../../types/Player';
import { BossSnapshot } from '../../types/Boss';

interface EntityMaps {
  playerMap: Map<string, ParsedPlayer>;
  bossMap: Map<number, BossSnapshot>;
}

/**
 * Create lookup maps for players and bosses
 * FIXME: bossMap uses custom_id as key because damage data uses custom_id as victim ID
 * This means multiple bosses of the same type share the same key (last one wins)
 */
export function createEntityMaps(
  players: ParsedPlayer[],
  bossSnapshots: BossSnapshot[]
): EntityMaps {
  const playerMap = new Map<string, ParsedPlayer>();
  players.forEach((p) => playerMap.set(p.custom_id, p));

  const bossMap = new Map<number, BossSnapshot>();
  bossSnapshots.forEach((boss) => bossMap.set(boss.custom_id, boss));

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

/**
 * Get display name for a boss
 * TODO: Need to add hashtable for boss_name_hash lookup to show
 * human-readable names like "Guardian", "Walker", "Shrine", etc.
 */
export function getBossDisplayName(boss: BossSnapshot): string {
  return `Boss ${boss.boss_name_hash} - Lane ${boss.lane}`;
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
