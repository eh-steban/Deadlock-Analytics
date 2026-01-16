import { ParsedPlayer, PlayerMatchData } from '../../types/Player';
import { BossSnapshot } from '../../types/Boss';
import {
  DamageTarget,
  PlayerDamageDistribution,
  TeamDamageDistribution,
  PlayerContribution,
  ObjectiveTarget,
  PlayerObjectiveDamage,
  ObjectiveDamageDistribution,
} from '../../domain/damageAnalysis';
import {
  createEntityMaps,
  sumDamageRecords,
  getBossDisplayName,
  getBossUniqueKey,
  sortAndCalculatePercentages,
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

  // Aggregate damage across ticks
  for (
    let tick = startTick;
    tick <= endTick && tick < playerData.damage.length;
    tick++
  ) {
    const tickDamage = playerData.damage[tick];
    if (!tickDamage) continue;

    // Iterate through victims
    Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
      const totalDamage = sumDamageRecords(damageRecords);
      if (totalDamage <= 0) return;

      damageByVictim.set(
        victimId,
        (damageByVictim.get(victimId) || 0) + totalDamage
      );
    });
  }

  // Categorize victims and create targets
  // TODO: We have neutralCreeps here, but the data does not appear yet.
  // There could be an issue with the IDs coming from the parser or we
  // simply aren't sending that data yet
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

    // Aggregate damage across ticks for this player
    for (
      let tick = startTick;
      tick <= endTick && tick < playerData.damage.length;
      tick++
    ) {
      const tickDamage = playerData.damage[tick];
      if (!tickDamage) continue;

      // Iterate through victims
      Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
        const totalDamage = sumDamageRecords(damageRecords);
        if (totalDamage <= 0) return;

        damageByVictim.set(
          victimId,
          (damageByVictim.get(victimId) || 0) + totalDamage
        );
      });
    }
  });

  // Categorize victims and create targets
  const targets: DamageTarget[] = [];
  let laneCreepsDamage = 0;
  let neutralCreepsDamage = 0;
  let totalDamage = 0;

  damageByVictim.forEach((damage, victimId) => {
    totalDamage += damage;

    // Check if victim is an enemy player
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
    // TODO: Add neutral creeps categorization
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

  // Aggregate damage from all team players to objectives
  teamPlayers.forEach((player) => {
    const playerData = perPlayerData[player.custom_id];
    if (!playerData || !playerData.damage) return;

    const playerDamageMap = damageByPlayerAndObjective.get(player.custom_id)!;

    // Aggregate damage across ticks for this player
    for (
      let tick = startTick;
      tick <= endTick && tick < playerData.damage.length;
      tick++
    ) {
      const tickDamage = playerData.damage[tick];
      if (!tickDamage) continue;

      // Iterate through victims
      Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
        // Check if victim is an objective boss
        const entityIndex = parseInt(victimId, 10);
        if (!entityIndex || !bossMap.has(entityIndex)) return;

        const totalDamage = sumDamageRecords(damageRecords);
        if (totalDamage <= 0) return;

        playerDamageMap.set(
          victimId,
          (playerDamageMap.get(victimId) || 0) + totalDamage
        );
      });
    }
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
