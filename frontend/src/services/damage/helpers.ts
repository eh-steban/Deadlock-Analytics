import { ParsedPlayer, PlayerMatchData } from '../../types/Player';
import { BossSnapshot } from '../../types/Boss';
import { DamageTarget } from '../../domain/damageAnalysis';

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

/**
 * Aggregate damage from a player's damage data into a victim map.
 * Iterates through ticks and accumulates damage per victim.
 * @param victimFilter Optional filter to include only specific victims
 */
export function aggregateDamageByVictim(
  playerData: PlayerMatchData,
  startTick: number,
  endTick: number,
  outputMap: Map<string, number>,
  victimFilter?: (victimId: string) => boolean
): void {
  for (
    let tick = startTick;
    tick <= endTick && tick < playerData.damage.length;
    tick++
  ) {
    const tickDamage = playerData.damage[tick];
    if (!tickDamage) continue;

    Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
      if (victimFilter && !victimFilter(victimId)) return;

      const totalDamage = sumDamageRecords(damageRecords);
      if (totalDamage <= 0) return;

      outputMap.set(victimId, (outputMap.get(victimId) || 0) + totalDamage);
    });
  }
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

interface CategorizedDamage {
  targets: DamageTarget[];
  totalDamage: number;
}

/**
 * Categorize victim damage into players, bosses, and creeps.
 * Creates DamageTarget objects for each category and aggregates creep damage.
 */
export function categorizeVictimDamage(
  damageByVictim: Map<string, number>,
  playerMap: Map<string, ParsedPlayer>,
  bossMap: Map<number, BossSnapshot>
): CategorizedDamage {
  const targets: DamageTarget[] = [];
  let laneCreepsDamage = 0;
  let neutralCreepsDamage = 0;
  let totalDamage = 0;

  damageByVictim.forEach((damage, victimId) => {
    totalDamage += damage;

    // Check if victim is a player
    const victimPlayer = playerMap.get(victimId);
    if (victimPlayer) {
      targets.push({
        id: victimId,
        name: `${victimPlayer.name} (${victimPlayer.hero.name})`,
        type: 'player',
        damage,
        team: victimPlayer.team,
        heroImage: victimPlayer.hero.images.icon_hero_card_webp,
      });
      return;
    }

    // Check if victim is a boss
    const entityIndex = parseInt(victimId, 10);
    if (entityIndex) {
      const boss = bossMap.get(entityIndex);
      if (boss) {
        targets.push({
          id: victimId,
          name: getBossDisplayName(boss),
          type: 'boss',
          damage,
          team: boss.team,
          bossNameHash: boss.boss_name_hash,
        });
        return;
      }
    }

    // Otherwise, categorize as lane creeps
    // TODO: Add neutral creeps categorization when data becomes available
    laneCreepsDamage += damage;
  });

  // Add aggregated creep targets
  if (laneCreepsDamage > 0) {
    targets.push({
      id: 'lane_creeps',
      name: 'Lane Creeps',
      type: 'lane_creeps',
      damage: laneCreepsDamage,
    });
  }

  if (neutralCreepsDamage > 0) {
    targets.push({
      id: 'neutral_creeps',
      name: 'Neutral Creeps',
      type: 'neutral_creeps',
      damage: neutralCreepsDamage,
    });
  }

  return { targets, totalDamage };
}
