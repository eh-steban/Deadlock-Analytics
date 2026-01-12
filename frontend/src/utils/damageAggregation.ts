import { ParsedPlayer, PlayerMatchData } from '../types/Player';
import { BossSnapshot } from '../types/Boss';

interface DamageTarget {
  id: string; // custom_id
  name: string;
  type: 'player' | 'boss' | 'lane_creeps' | 'neutral_creeps';
  damage: number;
  percentage?: number;
  team?: number;
  heroImage?: string;
  bossNameHash?: number;
}

export interface PlayerDamageDistribution {
  totalDamage: number;
  targets: DamageTarget[];
}

/**
 * Aggregate damage dealt by a specific player to all targets in a time range
 */
export function aggregatePlayerDamage(
  playerId: string,
  players: ParsedPlayer[],
  perPlayerData: Record<string, PlayerMatchData>,
  bossSnapshots: BossSnapshot[],
  startTick: number,
  endTick: number
): PlayerDamageDistribution {
  const playerData = perPlayerData[playerId];

  // Create maps for quick lookups
  const playerMap = new Map<string, ParsedPlayer>();
  players.forEach((p) => playerMap.set(p.custom_id, p));

  const bossMap = new Map<number, BossSnapshot>();
  bossSnapshots.forEach((boss) => bossMap.set(boss.custom_id, boss));

  // Track damage by victim
  const damageByVictim = new Map<string, number>();

  // Aggregate damage across ticks
  for (let tick = startTick; tick <= endTick && tick < playerData.damage.length; tick++) {
    const tickDamage = playerData.damage[tick];
    if (!tickDamage) continue;

    // Iterate through victims
    Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
      const totalDamage = damageRecords.reduce(
        (sum, record) => sum + (record.damage || 0),
        0
      );
      if (totalDamage <= 0) return;

      damageByVictim.set(victimId, (damageByVictim.get(victimId) || 0) + totalDamage);
    });
  }

  // Categorize victims and create targets
  const targets: DamageTarget[] = [];
  let laneCreepsDamage = 0;
  let neutralCreepsDamage = 0;
  let totalDamage = 0;

  damageByVictim.forEach((damage, victimId) => {
    totalDamage += damage;
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

    // Check if victim is a boss (parse custom_id from victimId)
    const entityIndex = parseInt(victimId, 10);
    if (entityIndex) {
      const boss = bossMap.get(entityIndex);
      if (boss) {
        // FIXME: Need to add hashtable for boss_name_hash lookup
        const bossName = `Boss ${boss.boss_name_hash} - Lane ${boss.lane}`;

        targets.push({
          id: victimId,
          name: bossName,
          type: 'boss',
          damage,
          team: boss.team,
          bossNameHash: boss.boss_name_hash,
        });
        return;
      }
    }

    // Otherwise, categorize as lane creeps or neutral creeps
    // For now, we'll aggregate all non-player, non-boss entities as lane creeps
    // TODO: Add more sophisticated categorization if needed
    laneCreepsDamage += damage;
  });

  // Add aggregated creep damage
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

  // Sort targets by damage (descending)
  targets.sort((a, b) => b.damage - a.damage);

  // Calculate percentages
  targets.forEach((target) => {
    target.percentage = totalDamage > 0 ? (target.damage / totalDamage) * 100 : 0;
  });

  return { totalDamage, targets };
}
