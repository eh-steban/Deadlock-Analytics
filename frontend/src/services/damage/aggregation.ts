import { ParsedPlayer, PlayerMatchData } from '../../domain/player';
import { BossSnapshot } from '../../domain/boss';
import {
  PlayerDamageDistribution,
  TeamDamageDistribution,
  PlayerContribution,
  ObjectiveTarget,
  PlayerObjectiveDamage,
  ObjectiveDamageDistribution,
} from '../../domain/damageAnalysis';
import {
  createEntityMaps,
  aggregateDamageByVictim,
  getBossDisplayName,
  getBossUniqueKey,
  sortAndCalculatePercentages,
  categorizeVictimDamage,
} from './helpers';

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
  const { playerMap, bossMap } = createEntityMaps(players, bossSnapshots);
  const damageByVictim = new Map<string, number>();

  aggregateDamageByVictim(playerData, startTick, endTick, damageByVictim);

  const { targets, totalDamage } = categorizeVictimDamage(
    damageByVictim,
    playerMap,
    bossMap
  );

  sortAndCalculatePercentages(targets, totalDamage);

  return { totalDamage, targets };
}

/**
 * Aggregate damage dealt by an entire team to all targets in a time range
 */
export function aggregateTeamDamage(
  teamId: number, // 2 = Amber, 3 = Sapphire
  players: ParsedPlayer[],
  perPlayerData: Record<string, PlayerMatchData>,
  bossSnapshots: BossSnapshot[],
  startTick: number,
  endTick: number
): TeamDamageDistribution {
  const { playerMap, bossMap } = createEntityMaps(players, bossSnapshots);
  const teamPlayers = players.filter((p) => p.team === teamId);
  // Track aggregated damage by victim across all team members
  const damageByVictim = new Map<string, number>();

  // Aggregate damage from all team players
  teamPlayers.forEach((player) => {
    const playerData = perPlayerData[player.custom_id];
    if (!playerData || !playerData.damage) return;

  // Filter for player victims only
  const playerVictimFilter = (victimId: string): boolean => {
    return !!victimId && playerMap.has(String(victimId));
  };

    aggregateDamageByVictim(playerData, startTick, endTick, damageByVictim, playerVictimFilter);
  });

  const { targets, totalDamage } = categorizeVictimDamage(
    damageByVictim,
    playerMap,
    bossMap
  );

  sortAndCalculatePercentages(targets, totalDamage);

  return { totalDamage, targets };
}

/**
 * Aggregate damage dealt by individual team members to objectives (bosses on enemy team)
 */
export function aggregateObjectiveDamage(
  teamId: number, // 2 = Amber, 3 = Sapphire
  players: ParsedPlayer[],
  perPlayerData: Record<string, PlayerMatchData>,
  bossSnapshots: BossSnapshot[],
  startTick: number,
  endTick: number
): ObjectiveDamageDistribution {
  // Create player map
  const playerMap = new Map<string, ParsedPlayer>();
  players.forEach((p) => playerMap.set(p.custom_id, p));

  // Filter bosses to only include enemy team objectives
  const enemyTeamId = teamId === 2 ? 3 : 2;
  const objectiveBosses = bossSnapshots.filter(
    (boss) => boss.team === enemyTeamId
  );

  const bossMap = new Map<number, BossSnapshot>();
  objectiveBosses.forEach((boss) => bossMap.set(boss.entity_index, boss));

  const teamPlayers = players.filter((p) => p.team === teamId);

  // Track damage per player per objective
  const damageByPlayerAndObjective = new Map<string, Map<string, number>>();
  teamPlayers.forEach((player) => {
    damageByPlayerAndObjective.set(player.custom_id, new Map<string, number>());
  });

  // Filter for boss victims only
  const bossVictimFilter = (victimId: string): boolean => {
    const entityIndex = parseInt(victimId, 10);
    return !!entityIndex && bossMap.has(entityIndex);
  };

  // Aggregate damage from all team players to objectives
  teamPlayers.forEach((player) => {
    const playerData = perPlayerData[player.custom_id];
    if (!playerData || !playerData.damage) return;

    const playerDamageMap = damageByPlayerAndObjective.get(player.custom_id)!;
    aggregateDamageByVictim(
      playerData,
      startTick,
      endTick,
      playerDamageMap,
      bossVictimFilter
    );
  });

  // Build objective targets with timing information
  const objectiveTargetsMap = new Map<string, ObjectiveTarget>();
  let totalObjectiveDamage = 0;

  damageByPlayerAndObjective.forEach((objectiveDamageMap) => {
    objectiveDamageMap.forEach((damage, objectiveId) => {
      totalObjectiveDamage += damage;

      const entityIndex = parseInt(objectiveId, 10);
      const boss = bossMap.get(entityIndex);
      if (!boss) return;

      const uniqueKey = getBossUniqueKey(boss);

      if (!objectiveTargetsMap.has(uniqueKey)) {
        objectiveTargetsMap.set(uniqueKey, {
          id: uniqueKey,
          name: getBossDisplayName(boss),
          type: 'boss',
          damage: 0,
          team: boss.team,
          bossNameHash: boss.boss_name_hash,
          spawnTime: boss.spawn_time_s,
          deathTime: boss.death_time_s,
        });
      }

      const objective = objectiveTargetsMap.get(uniqueKey);
      if (objective) {
        objective.damage += damage;
      }
    });
  });

  // Build player contributions and player-objective damage matrix
  const playerContributions: PlayerContribution[] = [];
  const playerObjectiveDamageMatrix: PlayerObjectiveDamage[] = [];

  damageByPlayerAndObjective.forEach((objectiveDamageMap, playerId) => {
    const player = playerMap.get(playerId);
    if (!player) return;

    let playerTotalDamage = 0;
    objectiveDamageMap.forEach((damage, objectiveId) => {
      playerTotalDamage += damage;

      // Get boss and unique key to look up objective
      const entityIndex = parseInt(objectiveId, 10);
      const boss = bossMap.get(entityIndex);
      if (!boss) return;

      const uniqueKey = getBossUniqueKey(boss);
      const objective = objectiveTargetsMap.get(uniqueKey);

      // Add to the matrix for sankey links
      if (objective && damage > 0) {
        playerObjectiveDamageMatrix.push({
          playerId: player.custom_id,
          playerName: player.name,
          objectiveId: uniqueKey,
          objectiveName: objective.name,
          damage,
        });
      }
    });

    if (playerTotalDamage > 0) {
      playerContributions.push({
        playerId: player.custom_id,
        playerName: player.name,
        heroName: player.hero.name,
        damage: playerTotalDamage,
        percentage:
          totalObjectiveDamage > 0
            ? (playerTotalDamage / totalObjectiveDamage) * 100
            : 0,
        heroImage: player.hero.images.icon_hero_card_webp,
      });
    }
  });

  // Sort player contributions by damage (descending)
  playerContributions.sort((a, b) => b.damage - a.damage);

  // Convert objectives map to array and sort by damage
  const objectiveTargets = Array.from(objectiveTargetsMap.values());
  sortAndCalculatePercentages(objectiveTargets, totalObjectiveDamage);

  return {
    totalObjectiveDamage,
    playerContributions,
    objectiveTargets,
    playerObjectiveDamageMatrix,
  };
}
